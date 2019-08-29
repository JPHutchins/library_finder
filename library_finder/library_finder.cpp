#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <cstring>
#include <regex>
#include <library_finder.h>

/*-------------------------------------------------------------------------------------------------
    Argument is the root directory under which to search for libraries.  Optionally include 
    the flag --type to specify audio, video, or photo.
    Prints a list of Collections and Libraries under that directory.
-------------------------------------------------------------------------------------------------*/

int main(int argc, char** argv) {

    if (argc < 2) {
        printf("Usage: [path] --type [ audio, video, or photo ]");
        return 1;
    }

    char target_extensions[150] = { NULL };

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
        else {
            printf("Usage: [ path ] --type [ audio, video, or photo ]");
            return 1;
        }
    }

    if (!target_extensions[0]) {
        strcpy_s(target_extensions, sizeof(AUDIO_EXTENSIONS), AUDIO_EXTENSIONS);
    }

    printf("\nStarting at %s\n", argv[1]);
    
    char* current_directory = argv[1];

    Dir_Tree_Node* root = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
    if (!root) {
        fprintf(stderr, "error: root (Dir_Tree_Node) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }
    root->name = current_directory;
    root->shortname = current_directory;
    root->next = nullptr;
    root->parent = nullptr;
    Dir_Tree_Node* tree_cursor = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
    if (!tree_cursor) {
        fprintf(stderr, "error: root (Dir_Tree_Node) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }
    tree_cursor = root;

    explore_paths(root, tree_cursor, 0, target_extensions);
    traverse_paths(root);
    make_directory_list(root, 0);

    free(root);

    return 0;
}

/*-------------------------------------------------------------------------------------------------
    explore_paths calls list_and_count recursively through the filesystem
    The struct Queue_Node is a linked list of subdirectories that keeps track of subdirectories of 
    the current folder and queues them up.
-------------------------------------------------------------------------------------------------*/

void explore_paths(Dir_Tree_Node* current_path, Dir_Tree_Node* tree_cursor, int track_count,
    char* target_extensions) {

    if (!current_path->name) {
        return;
    }

    char* current_directory = current_path->name;
    char* current_shortname = current_path->shortname;

    Queue_Node* current_subdirs = (Queue_Node*)malloc(sizeof(Queue_Node));
    if (current_subdirs) {
        current_subdirs->name = current_directory;
        current_subdirs->next = nullptr;
    }

    Cur_Dir_Info* output = (Cur_Dir_Info*)malloc(sizeof(Cur_Dir_Info));
    if (!output) {
        fprintf(stderr, "error: output (Cur_Dir_Info) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }

    Queue_Node* cursor = current_subdirs; 

    tree_cursor->name = current_directory;
    tree_cursor->shortname = current_shortname;
    tree_cursor->contained_albums_count = 0;
    tree_cursor->contained_collections_count = 0;
    tree_cursor->total_audio_file_count = 0;
    tree_cursor->total_albums_count = 0;

    output = list_and_count(current_directory, output, target_extensions);
    current_path->audio_file_count = output->audio_file_count;
    current_path->other_file_count = output->other_file_count;
    track_count += output->audio_file_count;
    printf("Found %d tracks in %s                                           \r",
        track_count, tree_cursor->shortname);

    Dir_Tree_Node* head = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
    if (!head) {
        fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }

    if (output->subdir) {
        Queue_Node* list = output->subdir;
        tree_cursor->subdirs = head;
        Dir_Tree_Node* current = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
        if (!current) {
            fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
            exit(EXIT_FAILURE);
        }
        current = head;

        while (list) {
            current->next = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
            current->next->name = list->name;
            current->next->shortname = list->shortname;
            current->parent = current_path;
            current->subdirs = nullptr;
            list = list->next;
            current = current->next;
            current->next = nullptr;
        }
        current = head->next;
        while (current->next) { 
            current = current->next;
        }
        head = head->next;
        explore_paths(head, head, track_count, target_extensions);
        current = nullptr;
    }
    if (current_path->next) {
        current_path = current_path->next;
    }
    else {
        return;
    }
    explore_paths(current_path, current_path, track_count, target_extensions);
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
        if (current_path->next) {
            traverse_paths(current_path->next);
        }
    }
    else if (current_path->next) {
        traverse_paths(current_path->next);
    }
    
    if (current_path->contained_collections_count >= 1) {
        current_path->type = Library;
        if (current_path->parent) {
            current_path->parent->total_audio_file_count += current_path->total_audio_file_count; 
            current_path->parent->total_albums_count += current_path->total_albums_count;
        }
    }
    else if (current_path->contained_albums_count >= 1) {
        current_path->type = Collection;
        if (current_path->parent) {
            current_path->parent->contained_collections_count++;
            current_path->parent->total_audio_file_count += current_path->total_audio_file_count; 
            current_path->parent->contained_albums_count += current_path->contained_albums_count;
            current_path->parent->total_albums_count += current_path->total_albums_count;
        }
    }
    else if (current_path->audio_file_count >= 1 && current_path->other_file_count <= 2) {
        current_path->type = Album;
        if (current_path->parent) {
            current_path->parent->contained_albums_count++;
            current_path->parent->total_albums_count++;
            current_path->parent->total_audio_file_count += current_path->audio_file_count;
        }
    }
    else {
        if (current_path->parent) {
            current_path->parent->total_audio_file_count += current_path->total_audio_file_count;
            current_path->parent->total_albums_count += current_path->total_albums_count;
        }
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

    if ((current_path->type == Library) | (current_path->type == Collection)) {
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
        if (current_path->next) {
            make_directory_list(current_path->next, depth);
        }
    }
    else if (current_path->next) {
        make_directory_list(current_path->next, depth);
    }
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
    char* target_extensions) {

    dirent** eps;
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
    Queue_Node* current = first;

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

                    current->name = (char*)malloc(sizeof(fullname));
                    if (!current->name) {
                        fprintf(stderr, "error: current->name (char*) allocation failed, exiting.\n");
                        exit(EXIT_FAILURE);
                    }
                    memcpy(current->name, fullname, sizeof(fullname));

                    current->shortname = (char*)malloc(sizeof(shortname));
                    if (!current->name) {
                        fprintf(stderr, "error: current->name (char*) allocation failed, exiting.\n");
                        exit(EXIT_FAILURE);
                    }
                    current->shortname = shortname;

                    Queue_Node* next = (Queue_Node*)malloc(sizeof(Queue_Node));
                    if (!next) {
                        fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
                        exit(EXIT_FAILURE);
                    }

                    current->next = next;
                    current = next;
                }
                else if (output->other_file_count < 2) {
                    if (std::regex_match(shortname, std::regex(target_extensions))) {
                        output->audio_file_count++;
                    }
                    else {
                        output->other_file_count++;
                    }
                }
                current->name = nullptr;
                current->shortname = nullptr;
                current->next = nullptr;
            }
        }
        current = nullptr;
    }

    else {
        perror("Couldn't open the directory");
        first = nullptr;
    }

    output->parent_path = current_directory;
    if (output->subdir_count > 0) {
        output->subdir = first;
    }
    else {
        output->subdir = nullptr;
    }

    free(current_stat);
    return output;
}