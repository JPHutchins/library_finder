/*-------------------------------------------------------------------------------------------------
    Find potential file libraries on a file system.
    Copyright(C) 2019-2020 J.P. Hutchins

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
#include "head.txt"
;

const char* body_html =
#include "body.txt"
;

#define DEVELOPMENT false

#if DEVELOPMENT
    const char* css_source =
        "<link rel = \"stylesheet\" type = \"text/css\" href = \"src/style.css\">";
    const char* js_source_1 =
        "<script src=\"src/script.js\"></script>";
    const char* js_source_2 = "";
    const char* js_source_3 = "";
    const char* js_source_4 = "";
#else // PRODUCTION
    const char* css_source =
    #include "style.txt"
    ;
    const char* js_source_1 =
    #include "script_1.txt"
    ;
    const char* js_source_2 =
    #include "script_2.txt"
    ;
    const char* js_source_3 =
    #include "script_3.txt"
    ;
    const char* js_source_4 =
    #include "script_4.txt"
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
    bool file_names = false;

    for (int i = 2; i < (argc); i++) {
        if (!strcmp(argv[i], "--type")) {
            i++;
            if (!strcmp(argv[i], "audio")) {
                memcpy(target_extensions, AUDIO_EXTENSIONS, sizeof(AUDIO_EXTENSIONS));
            }
            else if (!strcmp(argv[i], "video")) {
                memcpy(target_extensions, VIDEO_EXTENSIONS, sizeof(VIDEO_EXTENSIONS));
            }
            else if (!strcmp(argv[i], "photo")) {
                memcpy(target_extensions, PHOTO_EXTENSIONS, sizeof(PHOTO_EXTENSIONS));
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
        else if (!strcmp(argv[i], "--files")) {
            file_names = true;
        }
        else {
            printf("Usage: [path] --type [ string ] --tolerance [ integer ] --html");
            return 1;
        }
    }

    if (!target_extensions[0]) {
        memcpy(target_extensions, AUDIO_EXTENSIONS, sizeof(AUDIO_EXTENSIONS));
    }

    printf("\nStarting at %s\n", argv[1]);
    
    //  The next six lines have mallocs that are necessary due to the way that
    //  "name" and "shortname" are malloced in the list_and_count function and later
    //  freed in the free_paths function.
    char* current_directory = (char*)malloc(strlen(argv[1]) + 1);
    if (current_directory) {
        memcpy(current_directory, argv[1], strlen(argv[1]) + 1);
    }
    char* current_shortname = (char*)malloc(strlen(argv[1]) + 1);
    if (current_shortname) {
        memcpy(current_shortname, argv[1], strlen(argv[1]) + 1);
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

    explore_paths(root, &total_count, target_extensions, tolerance, file_names);
    traverse_paths(root);
    Dir_Tree_Node** largest_libraries = find_largest_libraries(root);

    printf("\n");

    if (html == true) {
        make_library_explorer(largest_libraries, root, argc, argv);
    }
    else {
        make_directory_list(root, 0);
        printf("\nThe largest libraries are:\n");
        int i = 0;
        while (i < 10) {
            printf(
                "%s - %d files in %d albums\n",
                largest_libraries[i]->name,
                largest_libraries[i]->total_audio_file_count,
                largest_libraries[i]->total_albums_count
            );
            i++;
        }
        printf("\n");
    }

    free(largest_libraries);
    free_paths(root);

    return 0;
}

/*-------------------------------------------------------------------------------------------------
    explore_paths calls list_and_count recursively through the filesystem
    The struct Queue_Node is a linked list of subdirectories that keeps track of subdirectories of 
    the current folder and queues them up.
-------------------------------------------------------------------------------------------------*/

void explore_paths(Dir_Tree_Node* current_path, int* track_count,
    char* target_extensions, unsigned int tolerance, bool file_names) {

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

    output = list_and_count(current_directory, output, target_extensions, tolerance, file_names);

    current_path->name = current_directory;
    current_path->shortname = current_shortname;
    current_path->contained_albums_count = 0;
    current_path->contained_collections_count = 0;
    current_path->total_audio_file_count = 0;
    current_path->total_albums_count = 0;
    current_path->audio_file_count = output->audio_file_count;
    current_path->other_file_count = output->other_file_count;
    current_path->file_list = output->file_list;
    current_path->type = None;

    char trunc_shortname[11];
    memcpy(trunc_shortname, current_path->shortname, 10);
    trunc_shortname[10] = '\0';
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
        explore_paths(head, track_count, target_extensions, tolerance, file_names);
        current = nullptr;
    }

    if (current_path->next) {
        current_path = current_path->next;
        explore_paths(current_path, track_count, target_extensions, tolerance, file_names);
    }

    free(output);
    return;
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
    char* target_extensions, unsigned int tolerance, bool file_names) {

    struct dirent** eps;
    int n = scandir(current_directory, &eps, one, alphasort);
    struct stat* current_stat = (struct stat*)malloc(sizeof(struct stat));
    if (!current_stat) {
        fprintf(stderr, "error: current_stat (stat*) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }

    if ((n <= 0) ||
        (!strcmp(current_directory, "C:\\\\Windows")) ||
        (!strcmp(current_directory, "C:\\Windows"))) {
        printf("Couldn't open the directory: %s\n", current_directory);
        free(current_stat);
        free(eps);
        output->shortname = nullptr;
        output->subdir = nullptr;
        output->file_list = nullptr;
        output->audio_file_count = 0;
        output->other_file_count = 0;
        output->subdir_count = 0;
        return output;
    }

    Queue_Node* first = (Queue_Node*)malloc(sizeof(Queue_Node));
    if (!first) {
        fprintf(stderr, "error: first (Queue_Node) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }

    output->audio_file_count = 0;
    output->other_file_count = 0;
    output->subdir_count = 0;

    char fullname[MAX_PATH_LENGTH] = { '\0' };
    size_t path_length = strlen(current_directory);
    memcpy(fullname, current_directory, path_length);

    int l = 0;
    if (fullname[path_length] != SLASH) {
        fullname[path_length] = SLASH;
        l = 1;
    }

    Queue_Node* current = first;
    Queue_Node* fl_head = nullptr;
    Queue_Node* fl_current = nullptr;

    for (int i = 0; i < n; i++) {

        if (eps[i]->d_name[0] == '.') {
            continue;
        }

        char* shortname = eps[i]->d_name;
        size_t shortname_length = strlen(shortname) + 1;
        int k = 0;
        while (k < shortname_length) {
            fullname[path_length + k + l] = shortname[k];
            k++;
        }
        stat(fullname, current_stat);

        if (current_stat != NULL && S_ISDIR(current_stat->st_mode) != 0) {
            output->subdir_count++;

            size_t fullname_length = path_length + k + l + 1;

            current->name = (char*)malloc(fullname_length);
            if (!current->name) {
                fprintf(stderr, "error: current->name (char*) allocation failed, exiting.\n");
                exit(EXIT_FAILURE);
            }
            memcpy(current->name, fullname, fullname_length);

            current->shortname = (char*)malloc(shortname_length);
            if (!current->shortname) {
                fprintf(stderr, "error: current->shortname (char*) allocation failed, exiting.\n");
                exit(EXIT_FAILURE);
            }
            memcpy(current->shortname, shortname, shortname_length);

            Queue_Node* next = (Queue_Node*)malloc(sizeof(Queue_Node));
            if (!next) {
                fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
                exit(EXIT_FAILURE);
            }
            current->next = next;
            current = next;
        }
        else if (output->other_file_count <= tolerance) {
            if (!std::regex_match(shortname,
                std::regex(target_extensions, std::regex_constants::icase))) {
                output->other_file_count++;
            }
            else {
                output->audio_file_count++;

                if (file_names) {
                    if (!fl_head) {
                        fl_head = (Queue_Node*)malloc(sizeof(Queue_Node));
                        fl_current = fl_head;
                    }
                    else {
                        fl_current->next = (Queue_Node*)malloc(sizeof(Queue_Node));
                        fl_current = fl_current->next;
                    }
                    fl_current->name = nullptr;
                    fl_current->shortname = (char*)malloc(shortname_length);
                    memcpy(fl_current->shortname, shortname, shortname_length);
                    fl_current->next = nullptr;
                }
            }
        }
        if (output->other_file_count > tolerance) {
            output->audio_file_count = 0;
            while (fl_head) {
                Queue_Node* tmp = fl_head->next;
                free(fl_head);
                fl_head = tmp;
            }
            fl_head = nullptr;
        }
        current->name = nullptr;
        current->shortname = nullptr;
        current->next = nullptr;
    }

    current = nullptr;

    output->file_list = fl_head;
    output->parent_path = current_directory;

    if (output->subdir_count > 0) {
        output->subdir = first;
    }
    else {
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

/*-------------------------------------------------------------------------------------------------
    traverse_paths looks through the representation of the filesystem created by explore_paths and
    classifies folders according to these rules:
    Albums contain 1 or more Tracks
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
        Queue_Node* list = current_path->file_list;
        if (list) {
            fprintf(fp, "<ul>");
            while (list) {
                fprintf(fp, "<li class=\"file library-item\">%s</li>", list->shortname);
                list = list->next;
            }
            fprintf(fp, "</ul>");
        }
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
    free(init);

    return result;
}

/*-------------------------------------------------------------------------------------------------
    Create the library_explorer GUI.
-------------------------------------------------------------------------------------------------*/

void make_library_explorer(Dir_Tree_Node** largest_libraries, Dir_Tree_Node* root, int argc,
    char** argv) {

    FILE* fp = fopen("library_explorer.html", "w+");
    fprintf(fp, "%s%s%s", head_html, css_source, body_html);
    int i = 0;
    while (i < 10) {
        fprintf(fp,
            "<li class=\"largest-folders\" "
            "data-total-albums=\"%d\" "
            "data-total-audio-files=\"%d\" "
            "data-full-path=\"%s\">"
            "%s</li>",
            largest_libraries[i]->total_albums_count,
            largest_libraries[i]->total_audio_file_count,
            largest_libraries[i]->name,
            largest_libraries[i]->name);
        i++;
    }

    fprintf(fp, "</ul></div></div>");

    fprintf(fp,
        "<div class=\"main\">"
        "<div id=\"explorer-container\">"
        "<ul id=\"library-explorer\" class=\"show-list\">");
    make_html_directory_list(root, fp);
    fprintf(fp, "</ul>");

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

/*-------------------------------------------------------------------------------------------------
    free_paths frees the data structure from memory.
-------------------------------------------------------------------------------------------------*/

void free_paths(Dir_Tree_Node* current_path) {
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

    Queue_Node* list = current_path->file_list;
    while (list) {
        Queue_Node* tmp = list->next;
        free(list->shortname);
        free(list);
        list = tmp;
    }
   
    free(current_path->shortname);
    free(current_path->name);
    free(current_path->subdirs);
    free(current_path);
}