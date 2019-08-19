#include <dirent.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <string.h>
#include <cstring>
#include <regex>
#include <list_and_count.h>


Cur_Dir_Info* list_and_count(char* current_directory, Cur_Dir_Info* output) {

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
                    if (std::regex_match(shortname, std::regex(".+\.(wav|mp3)"))) { //todo define at top and/or use flags
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