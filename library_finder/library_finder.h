
#include <list_and_count.h>

//Classification is determined by analyzing what a folder contains.  At the bottom there are Tracks
//that are defined as audio files.  A folder that contains one or more audio files and one or no subdirectories
//is classified as an Album.  A folder that contains one or more Albums is classified as a Collection.
//A folder that contains one or more Collections is classified as a Library.  The Folder classification 
//is reserved for folders that do not meet these classifications yet still contains Tracks.
enum classification { Folder, Library, Collection, Album };

typedef struct Dir_Tree_Node {
    char* name;
    char* shortname;
    enum classification type;
    struct Dir_Tree_Node* parent;
    struct Dir_Tree_Node* subdirs;
    struct Dir_Tree_Node* next;
    int contained_collections_count;
    int contained_albums_count;
    int audio_file_count;
    int other_file_count;
    int total_audio_file_count;
    int total_albums_count;
}Dir_Tree_Node;

void explore_paths(Dir_Tree_Node* current_path, Dir_Tree_Node* tree_cursor, int track_count);

void traverse_paths(Dir_Tree_Node* current_path);

void make_directory_list(Dir_Tree_Node* current_path, int depth);