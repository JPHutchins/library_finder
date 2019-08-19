#define SLASH '\\' // WINDOWS SLASH
#define MAX_PATH_LENGTH 1017

static int one(const struct dirent* unused)
{
    return 1;
}

typedef struct Queue_Node {
    char* name;
    char* shortname;
    struct Queue_Node* next;
}Queue_Node;

typedef struct Cur_Dir_Info {
    char* parent_path;
    char* shortname;
    struct Queue_Node* subdir;
    int audio_file_count;
    int other_file_count;
    int subdir_count;
    struct Dir_Tree_Node* cursor;
}Cur_Dir_Info;

Cur_Dir_Info* list_and_count(char* current_directory, Cur_Dir_Info* output);