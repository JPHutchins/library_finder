#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <library_finder.h>


int main(int argc, char** argv) {

    if (argc < 2) {
        printf("Usage: root path to search from: <path> ");
        return 1;
    }

    printf("\nStarting at %s\n", argv[1]);
    
    char* current_directory = argv[1];

    Dir_Tree_Node* root = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
    root->name = current_directory;
    root->shortname = current_directory;
    root->next = nullptr;
    root->parent = nullptr;
    Dir_Tree_Node* tree_cursor = (Dir_Tree_Node*)malloc(sizeof(Dir_Tree_Node));
    tree_cursor = root;

    explore_paths(root, tree_cursor, 0);
    traverse_paths(root);
    make_directory_list(root, 0);

    return 0;
}

void explore_paths(Dir_Tree_Node* current_path, Dir_Tree_Node* tree_cursor, int track_count) {

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

    output = list_and_count(current_directory, output);
    current_path->audio_file_count = output->audio_file_count;
    current_path->other_file_count = output->other_file_count;
    track_count += output->audio_file_count;
    printf("Found %d tracks in %s                                           \r", track_count, tree_cursor->shortname);

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
        explore_paths(head, head, track_count);
        current = nullptr;
    }
    if (current_path->next) {
        current_path = current_path->next;
    }
    else {
        return;
    }
    explore_paths(current_path, current_path, track_count);
}

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
        printf("\\%s - contains %d tracks in %d albums\n", current_path->shortname, current_path->total_audio_file_count, current_path->total_albums_count);
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


