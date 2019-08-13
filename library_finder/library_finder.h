#define SLASH '\\' // WINDOWS SLASH

//Classification is determined by analyzing what a folder contains.  At the bottom there are Tracks
//that are defined as audio files.  A folder that contains one or more audio files and one or no subdirectories
//is classified as an Album.  A folder that contains one or more Albums is classified as a Collection.
//A folder that contains one or more Collections is classified as a Library.  The Folder classification 
//is reserved for folders that do not meet these classifications yet still contains Tracks.
enum classification { Folder, Library, Collection, Album };

//selector function for scandir (3rd argument)
static int one(const struct dirent* unused)
{
    return 1;
}

typedef struct Queue_Node {
    char* name;
    char* shortname;
    struct Queue_Node* next;
}Queue_Node;

typedef struct Dir_Tree_Node {
    char* name;
    char* shortname;
    enum classification type;
    struct Dir_Tree_Node* parent;
    struct Dir_Tree_Node* subdirs;
    struct Dir_Tree_Node* next; //linked list of subdirectories
    int contained_collections_count;
    int contained_albums_count;
    int audio_file_count; //current directory only
    int other_file_count; //current directory only, not including folders
    int total_audio_file_count;
    int total_albums_count;
}Dir_Tree_Node;

typedef struct Cur_Dir_Info {
    char* parent_path;
    char* shortname;
    struct Queue_Node* subdir;
    int audio_file_count;
    int other_file_count;
    int subdir_count;
    struct Dir_Tree_Node* cursor;
}Cur_Dir_Info;