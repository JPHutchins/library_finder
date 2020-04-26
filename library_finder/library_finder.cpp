/*-------------------------------------------------------------------------------------------------
    Find potential file libraries on a file system.
    Copyright(C) 2019 J.P. Hutchins

    This program is free software : you can redistribute itand /or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.If not, see < http://www.gnu.org/licenses/>.
-------------------------------------------------------------------------------------------------*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <cstring>
#include <regex>
#include <library_finder.h>

const char* head_html =
#include "head.html"
;

const char* body_html =
#include "body.html"
;

#define DEVELOPMENT false;

#if DEVELOPMENT
    const char* css_source =
        "<link rel = \"stylesheet\" type = \"text/css\" href = \"style.css\">";
    const char* js_source_1 =
        "<script src=\"script.js\"></script>";
    const char* js_source_2 = "";
    const char* js_source_3 = "";
    const char* js_source_4 = "";
#else // PRODUCTION
    const char* css_source =
    #include "style.h"
    ;
    const char* js_source_1 =
    #include "script_1.h"
    ;
    const char* js_source_2 =
    #include "script_2.h"
    ;
    const char* js_source_3 =
    #include "script_3.h"
    ;
    const char* js_source_4 =
    #include "script_4.h"
    ;
#endif

/*-------------------------------------------------------------------------------------------------
    Argument is the root directory under which to search for libraries.  Optionally include 
    the flag --type to specify audio, video, or photo.
    Prints a list of Collections and Libraries under that directory.
-------------------------------------------------------------------------------------------------*/

int main(int argc, char** argv) {

    if (argc < 2) {
        printf("\nUsage: [path] --type [ string ] --tolerance [ integer ] --html\n"
               "Type library_finder --help for more information.\n");
        return 1;
    }

    if (!strcmp(argv[1], "--help")) {
        printf("\nUsage: [ path (required) ] --type [ string ] --tolerance [ integer ]\n"
            "--type specifies target file types: audio (default), video or photo.\n"
            "--tolerance specifies how many non-target-type files to allow per folder\n"
            "    before skipping it.  Default is 2.\n"
            "--html outputs results to a file named library_explorer.html, good for large searches\n");
        return 1;
    }

    char target_extensions[150] = { NULL };
    unsigned int tolerance = TOLERANCE;
    bool html = false;

    for (int i = 2; i < (argc); i++) {
        if (!strcmp(argv[i], "--type")) {
            i++;
            if (!strcmp(argv[i], "audio")) {
                strcpy_s(target_extensions, sizeof(AUDIO_EXTENSIONS), AUDIO_EXTENSIONS);
            }
            else if (!strcmp(argv[i], "video")) {
                strcpy_s(target_extensions, sizeof(VIDEO_EXTENSIONS), VIDEO_EXTENSIONS);
            }
            else if (!strcmp(argv[i], "photo")) {
                strcpy_s(target_extensions, sizeof(PHOTO_EXTENSIONS), PHOTO_EXTENSIONS);
            }
            else {
                printf("--type can be audio, video, or photo (case sensitive)");
                return 1;
            }
        }
        else if (!strcmp(argv[i], "--tolerance")) {
            i++;
            tolerance = atoi(argv[i]);
        }
        else if (!strcmp(argv[i], "--html")) {
            html = true;
        }
        else {
            printf("Usage: [path] --type [ string ] --tolerance [ integer ] --html");
            return 1;
        }
    }

    if (!target_extensions[0]) {
        strcpy_s(target_extensions, sizeof(AUDIO_EXTENSIONS), AUDIO_EXTENSIONS);
    }

    printf("\nStarting at %s\n", argv[1]);
    
    //  The next six lines have mallocs that are necessary due to the way that
    //  "name" and "shortname" are malloced in the list_and_count function and later
    //  freed in the free_paths function.
    char* current_directory = (char*)malloc(sizeof(char*) * (strlen(argv[1]) + 1));
    if (current_directory) {
        strcpy_s(current_directory, sizeof(char*) * (strlen(argv[1]) + 1), argv[1]);
    }
    char* current_shortname = (char*)malloc(sizeof(char*) * (strlen(argv[1]) + 1));
    if (current_shortname) {
        strcpy_s(current_shortname, sizeof(char*) * (strlen(argv[1]) + 1), argv[1]);
    }

    Dir_Tree_Node* root = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
    
    if (root) {
        root->name = current_directory;
        root->shortname = current_shortname;
        root->next = nullptr;
        root->parent = nullptr;
        root->subdirs = nullptr;
    }
    int total_count = 0;

    explore_paths(root, &total_count, target_extensions, tolerance);
    traverse_paths(root);

    printf("\n");

    if (html == true) {
        FILE* fp;
        errno_t errorCode = fopen_s(&fp, "library_explorer.html", "w+");
        if (errorCode != 0) {
            fprintf(stderr, "error: error opening output html file, exiting.\n");
            exit(EXIT_FAILURE);
        }
        fprintf(fp, "%s%s%s", head_html, css_source, body_html);
        Dir_Tree_Node** results = find_largest_libraries(root);
        int i = 0;
        while (i < 10) {
            fprintf(fp, 
                "<li class=\"largest-folders\" "
                "data-total-albums=\"%d\" "
                "data-total-audio-files=\"%d\" "
                "data-full-path=\"%s\">"
                "%s</li>", 
                results[i]->total_albums_count,
                results[i]->total_audio_file_count,
                results[i]->name,
                results[i]->name);
            i++;
        }
        fprintf(fp, "</ul></div></div>");

        fprintf(fp,
            "<div class=\"main\">"
            "<div id=\"explorer-container\">"
            "<ul id=\"library-explorer\" class=\"show-list\">");
        make_html_directory_list(root, fp);
        fprintf(fp, "</ul>");

        for (int i = 0; i < 10; i++) {
            free(results[i]);
        }
        free(results);

        fprintf(fp, "<span id=\"command\" class=\"hidden\" data-command=\"");
        for (int i = 1; i < (argc); i++) {
            fprintf(fp, "%s ", argv[i]);
        }
        fprintf(fp, "\"></span>");

        fprintf(fp,
            "</div></div>"
            "</body>"
            "%s%s%s%s"
            "</html>",
            js_source_1, js_source_2, js_source_3, js_source_4
            );
        fclose(fp);
        printf("Created library_explorer.html, open it with an internet browser like Chrome.\n");
    }
    else {
        make_directory_list(root, 0);
    }
    //free_paths(root);
    return 0;
}

/*-------------------------------------------------------------------------------------------------
    explore_paths calls list_and_count recursively through the filesystem
    The struct Queue_Node is a linked list of subdirectories that keeps track of subdirectories of 
    the current folder and queues them up.
-------------------------------------------------------------------------------------------------*/

void explore_paths(Dir_Tree_Node* current_path, int* track_count,
    char* target_extensions, unsigned int tolerance) {

    if (!current_path->name) {
        return;
    }

    char* current_directory = current_path->name;
    char* current_shortname = current_path->shortname;

    Cur_Dir_Info* output = (Cur_Dir_Info*)malloc(sizeof(Cur_Dir_Info));
    if (!output) {
        fprintf(stderr, "error: output (Cur_Dir_Info) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }

    output = list_and_count(current_directory, output, target_extensions, tolerance);

    current_path->name = current_directory;
    current_path->shortname = current_shortname;
    current_path->contained_albums_count = 0;
    current_path->contained_collections_count = 0;
    current_path->total_audio_file_count = 0;
    current_path->total_albums_count = 0;
    current_path->audio_file_count = output->audio_file_count;
    current_path->other_file_count = output->other_file_count;

    char trunc_shortname[11];
    strncpy_s(trunc_shortname, current_path->shortname, 10);
    *track_count += output->audio_file_count;
    printf("Found %d tracks so far, now checking %s...          \r", *track_count, trunc_shortname);

    if (output->subdir) {
        Dir_Tree_Node* head = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
        if (!head) {
            fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
            exit(EXIT_FAILURE);
        }

        current_path->subdirs = head;
        Dir_Tree_Node* current = head;

        Queue_Node* list = output->subdir;
        while (list) {
            current->next = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
            if (current->next) {
                current->next->name = list->name;
                current->next->shortname = list->shortname;
                current->parent = current_path;
                current->subdirs = nullptr;
                current = current->next;
                current->next = nullptr;
            }
            else {
                fprintf(stderr, "error: current->next (Dir_Tree_Node) allocation failed, exiting.\n");
                exit(EXIT_FAILURE);
            }
            Queue_Node* tmp = list;
            list = list->next;
            free(tmp);
        }

        current = head->next;
        while (current->next) { 
            current = current->next;
        }

        head = head->next;
        explore_paths(head, track_count, target_extensions, tolerance);
        current = nullptr;
    }

    if (current_path->next) {
        current_path = current_path->next;
        explore_paths(current_path, track_count, target_extensions, tolerance);
    }

    free(output);
    return;
}

/*-------------------------------------------------------------------------------------------------
    traverse_paths looks through the representation of the filesystem created by explore_paths and
    classifies folders according to these rules:
    Albums contain 2 or more Tracks
    Collections contain 1 or more Albums or Collections
    Libraries contain 1 or more Collections
-------------------------------------------------------------------------------------------------*/

void traverse_paths(Dir_Tree_Node* current_path) {
    if (!current_path->name) {
        return;
    }

    if (current_path->subdirs) {
        traverse_paths(current_path->subdirs->next);
    }

    if (current_path->next) {
        traverse_paths(current_path->next);
    }
    
    if (current_path->contained_collections_count >= 1) {
        current_path->type = Library;
        if (current_path->parent) {
            current_path->parent->type = Path;
            current_path->parent->total_audio_file_count +=
                current_path->total_audio_file_count + current_path->audio_file_count;
            current_path->parent->total_albums_count +=
                current_path->total_albums_count;
        }
    }
    else if (current_path->contained_albums_count >= 1) {
        current_path->type = Collection;
        if (current_path->parent) {
            current_path->parent->contained_collections_count++;
            current_path->parent->total_audio_file_count += 
                current_path->total_audio_file_count + current_path->audio_file_count;
            current_path->parent->total_albums_count += current_path->total_albums_count;
        }
    }
    else if (current_path->audio_file_count >= 1) {
        current_path->type = Album;
        if (current_path->parent) {
            current_path->parent->contained_albums_count++;
            current_path->parent->total_albums_count++;
            current_path->parent->total_audio_file_count += current_path->audio_file_count;
        }
    }
    else if ((current_path->type == Path) && (current_path->parent)) {
        current_path->parent->type = Path;
        current_path->parent->total_audio_file_count += current_path->total_audio_file_count;
        current_path->parent->total_albums_count += current_path->total_albums_count; 
    }
}

/*-------------------------------------------------------------------------------------------------
    make_directory_list prints output to the user.  This list shows the user Libraries and
    Collections, where to find them in the filesystem, and how many albums are in their subtree.
-------------------------------------------------------------------------------------------------*/

void make_directory_list(Dir_Tree_Node* current_path, int depth) {
    if (!current_path->name) {
        return;
    }

    if ((current_path->type == Library) || 
        (current_path->type == Collection) ||
        (current_path->type == Path)) {
        int i = 0;
        while (i < depth) {
            printf(" ");
            i++;
        }
        printf("\\%s - contains %d tracks in %d albums\n", current_path->shortname, 
            current_path->total_audio_file_count, current_path->total_albums_count);
    }
 
    if (current_path->subdirs) {
        make_directory_list(current_path->subdirs->next, depth + 4);
    }

    if (current_path->next) {
        make_directory_list(current_path->next, depth);
    }
}

/*-------------------------------------------------------------------------------------------------
    make_html_directory_list writes a list to HTML file.  This list shows the user Libraries and
    Collections, where to find them in the filesystem, and how many albums are in each subtree.
-------------------------------------------------------------------------------------------------*/

void make_html_directory_list(Dir_Tree_Node* current_path, FILE* fp) {
    if (!current_path->name) {
        return;
    }

    bool ul = false;
    if (current_path->subdirs) {
        Dir_Tree_Node* subdirs = current_path->subdirs;
        while (subdirs) {
            if ((subdirs->type == Library) ||
                (subdirs->type == Collection) ||
                (subdirs->type == Album) ||
                (subdirs->type == Path)) {
                ul = true;
                break;
            }
            subdirs = subdirs->next;
        }
    }

    bool li = true;

    if (current_path->type == Library) {
        fprintf(fp, "<li class=\"library library-item\" "
            "data-contained-collections=\"%d\" "
            "data-contained-albums=\"%d\" "
            "data-total-albums=\"%d\" "
            "data-total-audio-files=\"%d\" "
            "data-full-path=\"%s\" "
            "data-shortname=\"%s\">",
            current_path->contained_collections_count,
            current_path->contained_albums_count,
            current_path->total_albums_count,
            current_path->total_audio_file_count,
            current_path->name,
            current_path->shortname);
        fprintf(fp, "%s", current_path->shortname);
    }
    else if (current_path->type == Collection) {
        fprintf(fp, "<li class=\"collection library-item\" "
            "data-contained-albums=\"%d\" "
            "data-total-albums=\"%d\" "
            "data-total-audio-files=\"%d\" "
            "data-full-path=\"%s\" "
            "data-shortname=\"%s\">",
            current_path->contained_albums_count,
            current_path->total_albums_count,
            current_path->total_audio_file_count,
            current_path->name,
            current_path->shortname);
        fprintf(fp, "%s", current_path->shortname);
    }
    else if (current_path->type == Path) {
        fprintf(fp, "<li class=\"path library-item\" "
            "data-total-albums=\"%d\" "
            "data-total-audio-files=\"%d\" "
            "data-full-path=\"%s\" "
            "data-shortname=\"%s\">",
            current_path->total_albums_count,
            current_path->total_audio_file_count,
            current_path->name,
            current_path->shortname);
        fprintf(fp, "%s", current_path->shortname);
    }
    else if (current_path->type == Album) {
        fprintf(fp, "<li class=\"album library-item\" "
            "data-contained-audio-files=\"%d\" "
            "data-full-path=\"%s\" "
            "data-shortname=\"%s\">",
            current_path->audio_file_count,
            current_path->name,
            current_path->shortname);
        fprintf(fp, "%s", current_path->shortname);
    }
    else {
        li = false;
    }

    if (ul) {
        fprintf(fp, "<ul>");
    }
    if (current_path->subdirs) {
        make_html_directory_list(current_path->subdirs->next, fp);
    }
    if (ul) {
        fprintf(fp, "</ul>");
    }

    if (li) {
        fprintf(fp, "</li>");
    }

    if (current_path->next) {
        make_html_directory_list(current_path->next, fp);
    } 
}

/*-------------------------------------------------------------------------------------------------
    insepct_paths is a helper function for find_largest_libraries.
-------------------------------------------------------------------------------------------------*/

void inspect_paths(Dir_Tree_Node* current_path, Dir_Tree_Node** result) {
    if (!current_path->name) {
        return;
    }

    if ((current_path->type == Library) || (current_path->type == Collection)) {
        int i = 0;
        while (i < 10) {
            if (current_path->total_albums_count > result[i]->total_albums_count) {
                int j = 9;
                while (j > i) {
                    result[j] = result[j-1];
                    j--;
                }
                result[i] = current_path;
                break;
            }
            i++;
        }
    }

    if (current_path->subdirs) {
        inspect_paths(current_path->subdirs->next, result);
    }

    if (current_path->next) {
        inspect_paths(current_path->next, result);
    }
}

/*-------------------------------------------------------------------------------------------------
    find_largest_libraries finds the paths to "Libaries" with the most albums.
-------------------------------------------------------------------------------------------------*/

Dir_Tree_Node** find_largest_libraries(Dir_Tree_Node* current_path) {

    Dir_Tree_Node* init = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
    if (init) {
        init->total_albums_count = 0;
    }
    else {
        fprintf(stderr, "error: init (Dir_Tree_Node) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }
    
    Dir_Tree_Node** result = (Dir_Tree_Node**)malloc(10 * sizeof(Dir_Tree_Node*));

    int i = 0;
    while (i < 10) {
        result[i] = init;
        i++;
    }

    inspect_paths(current_path, result);

    return result;
}

/*-------------------------------------------------------------------------------------------------
    free_paths frees the data structure from memory.
-------------------------------------------------------------------------------------------------*/

void free_paths(Dir_Tree_Node* current_path) {
    printf("\n%s", current_path->name);
    if (!current_path->name) {
        free(current_path);
        return;
    }

    if (current_path->subdirs) {
        free_paths(current_path->subdirs->next);
    }

    if (current_path->next) {
        free_paths(current_path->next);
    }
   
    free(current_path->shortname);
    free(current_path->name);
    free(current_path->subdirs);
    free(current_path);
}

/*-------------------------------------------------------------------------------------------------
    list_and_count opens current_directory and looks through its files.  It ignores hidden files
    and outputs a summary of the folders contents: a linked list of its subdirectories and an
    estimate* of the number of audio files (Tracks).

    *A compromise is made here.  A regular audio album directory is likely to contain audio files 
    only.  However, it may contain a few images or even a subfolder of images or text.
    list_and_count allows for 2 non-audio files before it SKIPS that folder entirely moving to
    the next.  This compromise is made to reduce time complexity by reducing the problem size given
    to the regular expression matching from [number of files in the filesystem] to [number of audio
    files in the filesystem + 2*(number of folders in the filesystem)].
-------------------------------------------------------------------------------------------------*/

Cur_Dir_Info* list_and_count(char* current_directory, Cur_Dir_Info* output,
    char* target_extensions, unsigned int tolerance) {

    struct dirent** eps;
    int n;
    n = scandir(current_directory, &eps, one, alphasort);
    struct stat* current_stat;
    current_stat = (struct stat*) malloc(sizeof(struct stat));
    if (!current_stat) {
        fprintf(stderr, "error: current_stat (stat*) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }

    Queue_Node* first = (Queue_Node*)malloc(sizeof(Queue_Node));
    if (!first) {
        fprintf(stderr, "error: first (Queue_Node) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }
    
    output->audio_file_count = 0;
    output->other_file_count = 0;
    output->subdir_count = 0;

    if (n >= 0) {
        char fullname[MAX_PATH_LENGTH] = { NULL };
        strcpy_s(fullname, current_directory);
        size_t path_length = strlen(current_directory);
        int l = 0;
        if (fullname[path_length] != SLASH) {
            fullname[path_length] = SLASH;
            l = 1;
        }

        Queue_Node* current = first;

        for (int i = 0; i < n; i++) {

            if (eps[i]->d_name[0] != '.') {
                char* shortname = eps[i]->d_name;
                size_t shortname_length = strlen(shortname);
                int k = 0;
                while (k < shortname_length) {
                    fullname[path_length + k + l] = shortname[k];
                    k++;
                }
                fullname[path_length + k + l] = NULL;
                stat(fullname, current_stat);
                
                if (current_stat != NULL && S_ISDIR(current_stat->st_mode) != 0) {
                    output->subdir_count++;

                    size_t fullname_length = path_length + k + 2;
                   
                    current->name = (char*)malloc(fullname_length);
                    if (!current->name) {
                        fprintf(stderr, "error: current->name (char*) allocation failed, exiting.\n");
                        exit(EXIT_FAILURE);
                    }
                    memcpy(current->name, fullname, fullname_length);

                    current->shortname = (char*)malloc(sizeof(char*) * (shortname_length + 1));
                    if (!current->shortname) {
                        fprintf(stderr, "error: current->shortname (char*) allocation failed, exiting.\n");
                        exit(EXIT_FAILURE);
                    }
                    strcpy_s(current->shortname, sizeof(char*) * (shortname_length + 1), shortname);
                    

                    Queue_Node* next = (Queue_Node*)malloc(sizeof(Queue_Node));
                    if (!next) {
                        fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
                        exit(EXIT_FAILURE);
                    }
                    current->next = next;
                    current = next;
                }
                else if (output->other_file_count <= tolerance) {
                    if (std::regex_match(shortname,
                            std::regex(target_extensions, std::regex_constants::icase))) {
                        output->audio_file_count++;
                    }
                    else {
                        output->other_file_count++; 
                    }
                }
               if (output->other_file_count > tolerance) {
                    output->audio_file_count = 0;
                }
                current->name = nullptr;
                current->shortname = nullptr;
                current->next = nullptr;
            }
        }  
        current = nullptr;
    }

    else {
        perror("Couldn't open the directory                         \r");
        free(first);
        free(current_stat);
        for (int i = 0; i < n; i++) {
            free(eps[i]);
        }
        free(eps);
        return output;
    }

    output->parent_path = current_directory;

    if (output->subdir_count > 0) {
        output->subdir = first;
    } else {
        output->subdir = nullptr;
        free(first);
    }

    free(current_stat);

    for (int i = 0; i < n; i++) {
        free(eps[i]);
    }
    free(eps);

    return output;
}