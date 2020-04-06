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

#define SLASH '\\' // WINDOWS SLASH
#define MAX_PATH_LENGTH 1017
#define TOLERANCE 2
#define AUDIO_EXTENSIONS ".+\.(aa|aac|aax|aiff|alac|flac|m4a|mp3|ogg|wav|wma)"
#define VIDEO_EXTENSIONS ".+\.(mkv|flv|vob|ogv|avi|MTS|TS|M2TS|mts|ts|m2ts|mov|qt|wmv|mp4|m4p|m4v\
                         |mpg|mp2|mpeg|mpe|mpv|mpg|m2v|3gp|3g2)"
#define PHOTO_EXTENSIONS ".+\.(gif|jpg)"

/*-------------------------------------------------------------------------------------------------
    Classification is determined by analyzing what a folder contains.  At the bottom there are
    Tracks that are defined as audio files.  A folder that contains one or more audio files and
    one or no subdirectories is classified as an Album.  A folder that contains one or more Albums
    is classified as a Collection.  A folder that contains one or more Collections is classified as
    a Library.  The Folder classification is reserved for folders that do not meet these
    classifications yet still contains Tracks.
-------------------------------------------------------------------------------------------------*/

enum classification { Folder, Library, Collection, Album };

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

Cur_Dir_Info* list_and_count(char* current_directory, Cur_Dir_Info* output,
    char* target_extensions, unsigned int tolerance);

void explore_paths(Dir_Tree_Node* current_path, Dir_Tree_Node* tree_cursor, int* track_count,
    char* target_extensions, unsigned int tolerance);

void traverse_paths(Dir_Tree_Node* current_path);

void make_directory_list(Dir_Tree_Node* current_path, int depth);

void make_html_directory_list(Dir_Tree_Node* current_path, FILE* fp);