#include <stdio.h>
#include <dirent.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <string.h>
#include <cstring>
#include <regex>

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

struct Queue_Node {
	char* name;
	char* shortname;
	struct Queue_Node* next;
};

struct Chain_Node {
	struct Queue_Node* subdir_list;
	struct Chain_Node* next;
};

struct Dir_Tree_Node {
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
};

struct Cur_Dir_Info {
	char* parent_path;
	char* shortname;
	struct Queue_Node* subdir;
	int audio_file_count;
	int other_file_count;
	int subdir_count;
	struct Dir_Tree_Node* cursor;
};

struct Cur_Dir_Info* list_and_count(char* current_directory, struct Cur_Dir_Info* output) {

	//directory listing stuff
	struct dirent** eps;
	int n;
	n = scandir(current_directory, &eps, one, alphasort);
	//printf("Files in path: %d\n", n);
	size_t path_length = strlen(current_directory);
	//printf("Length of pathname: %zd\n", path_length);
	struct stat* current_stat;
	current_stat = (struct stat*) malloc(sizeof(struct stat));

	//linked list queuing
	struct Queue_Node* first = (struct Queue_Node*)malloc(sizeof(struct Queue_Node));
	if (!first) {
		fprintf(stderr, "error: first (Queue_Node) allocation failed, exiting.\n");
		exit(EXIT_FAILURE);
	}
	struct Queue_Node* current = first;

	output->audio_file_count = 0;
	output->other_file_count = 0;
	output->subdir_count = 0;

	if (n >= 0) {
		char* shortname = (char*)malloc(0);
		for (int i = 0; i < n; i++) {
			if (eps[i]->d_name[0] != '.') { //temporary hack to avoid hidden directories and current/parent

				char fullname[1000] = { NULL };
				int j = 0;
				while (j < path_length) {
					fullname[j] = current_directory[j];
					j++;
				}
				int l = 0;
				if (fullname[path_length] != SLASH) {
					fullname[path_length] = SLASH;
					l = 1;
				}

				shortname = (char*)realloc(shortname, sizeof(eps[i]->d_name)); //need to dynamically allocate this in the future
				if (!shortname) {
					fprintf(stderr, "error: shortname (char*) allocation failed, exiting.\n");
					exit(EXIT_FAILURE);
				}
				memcpy(shortname, eps[i]->d_name, sizeof(eps[i]->d_name));


				for (unsigned int k = 0; k < strlen(eps[i]->d_name) / sizeof(char); k++) {
					fullname[path_length + k + l] = shortname[k * sizeof(char)];
				}

				stat(fullname, current_stat);

				if (current_stat != NULL && S_ISDIR(current_stat->st_mode) != 0) {
					//printf("Found directory: %s\n", fullname);
					output->subdir_count++;
					// TO DO: . and .. are not valid directory names

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
					current->shortname = eps[i]->d_name;
					//printf("%s\n", current->shortname);
					struct Queue_Node* next = (struct Queue_Node*)malloc(sizeof(struct Queue_Node));
					if (!next) {
						fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
						exit(EXIT_FAILURE);
					}
					current->next = next;
					current = next;
				}
				else if (output->other_file_count < 5) {
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
		//printf("Completed\n");
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
	//output->audio_file_count = 1;
	//output->other_file_count = 2;
	return output;
}

void explore_paths(struct Dir_Tree_Node* current_path, struct Dir_Tree_Node* tree_cursor, int track_count) {

	if (!current_path->name) {
		return;
	}



	char* current_directory = current_path->name;
	char* current_shortname = current_path->shortname;

	struct Queue_Node* current_subdirs = (struct Queue_Node*)malloc(sizeof(struct Queue_Node));
	current_subdirs->name = current_directory;
	current_subdirs->next = nullptr;

	struct Cur_Dir_Info* output = (struct Cur_Dir_Info*)malloc(sizeof(struct Cur_Dir_Info));
	if (!output) {
		fprintf(stderr, "error: output (Cur_Dir_Info) allocation failed, exiting.\n");
		exit(EXIT_FAILURE);
	}

	struct Queue_Node* cursor = current_subdirs; //initialize to root of path

	//printf("Running:  %s\n", current_directory);
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
	printf("Found %d tracks so far                         \r", track_count);

	struct Dir_Tree_Node* head = (struct Dir_Tree_Node*)malloc(sizeof(struct Dir_Tree_Node));
	if (!head) {
		fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
		exit(EXIT_FAILURE);
	}

	if (output->subdir) { //check if there are subdirectories
		struct Queue_Node* list = output->subdir;

		tree_cursor->subdirs = head;

		struct Dir_Tree_Node* current = (struct Dir_Tree_Node*)malloc(sizeof(struct Dir_Tree_Node));
		if (!current) {
			fprintf(stderr, "error: next (Queue_Node) allocation failed, exiting.\n");
			exit(EXIT_FAILURE);
		}
		current = head;


		/*current->next = (struct Dir_Tree_Node*)malloc(sizeof(struct Dir_Tree_Node));
		current->next->name = list->name;
		current = current->next;
		list = list->next;*/

		while (list) {
			current->next = (struct Dir_Tree_Node*)malloc(sizeof(struct Dir_Tree_Node));
			current->next->name = list->name;
			current->next->shortname = list->shortname;
			current->parent = current_path;
			current->subdirs = nullptr;

			list = list->next;
			current = current->next;
			current->next = nullptr;
		}
		current = head->next;
		while (current->next) { //won't work if there is a single subdirectory
			//printf("Checking Dir_Tree_Nodes %s\n", current->name);
			current = current->next;
		}
		//printf("finished Dir_Tree_Node write\n");
		head = head->next;
		explore_paths(head, head, track_count); //recurse downward
		current = nullptr;
	}
	//printf("Success and recursing\n");
	if (current_path->next) {
		current_path = current_path->next;
	}
	else {
		return;
	}
	//current_path->next = (struct Dir_Tree_Node*)malloc(sizeof(struct Dir_Tree_Node));
	explore_paths(current_path, current_path, track_count);
}

void traverse_paths(struct Dir_Tree_Node* current_path, int track_count, int album_count) {
	if (!current_path->name) {
		return;
	}

	if (current_path->subdirs) { //check for subdirectories first
		traverse_paths(current_path->subdirs->next, track_count, album_count);
		if (current_path->next) {
			traverse_paths(current_path->next, track_count, album_count);
		}
	}
	else if (current_path->next) { //if there are not subdirectories go to next directory
		traverse_paths(current_path->next, track_count, album_count);
	}

	printf("Found %d tracks in %d different albums\r", track_count, album_count);
	//printf("%s\nAudio: %d\nOther: %d\n", current_path->name, current_path->audio_file_count, current_path->other_file_count);
	//printf("%s\n", current_path->name);
	if (current_path->contained_collections_count >= 1) {
		current_path->type = Library;
		if (current_path->parent) { //annoying
			current_path->parent->total_audio_file_count += current_path->total_audio_file_count; //warning, this ignores tracks at the root of the collection
			current_path->parent->total_albums_count += current_path->total_albums_count;
		}
	}
	else if (current_path->contained_albums_count >= 1) {
		current_path->type = Collection;
		if (current_path->parent) {
			current_path->parent->contained_collections_count++;
			current_path->parent->total_audio_file_count += current_path->total_audio_file_count; //warning, this ignores tracks at the root of the collection
			current_path->parent->contained_albums_count += current_path->contained_albums_count;
			current_path->parent->total_albums_count += current_path->contained_albums_count;
		}
	}
	else if (current_path->audio_file_count >= 1 && current_path->other_file_count <= 2) {
		current_path->type = Album;
		track_count += current_path->audio_file_count;
		album_count++;
		if (current_path->parent) {
			current_path->parent->contained_albums_count++;
			current_path->parent->total_audio_file_count += current_path->audio_file_count;
		}
	}
	else {
		current_path->parent->total_audio_file_count += current_path->total_audio_file_count; //warning, this ignores tracks at the root of the collection
		current_path->parent->total_albums_count += current_path->total_albums_count;
	}
	/*if (current_path->type == Library) {
		printf("Found Library at: %s\n"
			   "Containing %d Albums and %d Tracks\n", current_path->name, current_path->total_albums_count, current_path->total_audio_file_count);
	}*/
	//printf("%s\nAudio: %d\nOther: %d\n", current_path->name, current_path->audio_file_count, current_path->other_file_count);
}

void make_directory_list(struct Dir_Tree_Node* current_path, int depth) {
	if (!current_path->name) {
		return;
	}

	if (current_path->type == Library | current_path->type == Collection) {
		int i = 0;
		while (i < depth) {
			printf(" ");
			i++;
		}
		printf("\\%s - contains %d tracks in %d albums\n", current_path->shortname, current_path->total_audio_file_count, current_path->total_albums_count);
	}


	if (current_path->subdirs) { //check for subdirectories first
		make_directory_list(current_path->subdirs->next, depth + 4);
		if (current_path->next) {
			make_directory_list(current_path->next, depth);
		}
	}
	else if (current_path->next) { //if there are not subdirectories go to next directory
		make_directory_list(current_path->next, depth);
	}
}

int main(int argc, char** argv) {

	if (argc < 2) {
		printf("Usage: One or more root paths to search from <path> <path> <path> ...");
		return 1;
	}

	printf("\nStarting at ");
	for (int i = 1; i < argc; i++) {
		printf(argv[i]);
	} printf("\n\n");

	char** path_list = argv;
	char* current_directory = path_list[1];

	struct Dir_Tree_Node* root = (struct Dir_Tree_Node*)malloc(sizeof(struct Dir_Tree_Node));
	root->name = current_directory;
	root->shortname = current_directory;
	root->next = nullptr;
	root->parent = nullptr;
	struct Dir_Tree_Node* tree_cursor = root;

	explore_paths(root, tree_cursor, 0);
	traverse_paths(root, 0, 0);
	make_directory_list(root, 0);

	/*cursor = first;
	while (cursor != NULL) {
		struct Queue_Node* next = cursor->next;
		free(cursor);
		cursor = next;
	}*/
	return 0;
}
