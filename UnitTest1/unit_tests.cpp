#include "pch.h"
#include "CppUnitTest.h"
#include <iostream>
#include "unit_tests.h"

//  You must provide your LOCAL project path here:
#define PROJECT_PATH "G:/Local Dev Files/library_finder/library_finder/unit_tests/tests/"

/*
    Function test() takes a const char* "string" that is the path to a test folder and 
    returns an int from the list_and_count function representing the number of target
    files found in that test folder:

    test("relative_path/to/desired_test")
*/

using namespace Microsoft::VisualStudio::CppUnitTestFramework;

namespace test_list_and_count
{
/*
    Simple_counting verifies that the function is counting audio files insimple folders
    that only contain audio files.
*/
    TEST_CLASS(Simple_Counting)
    {
    public:
        TEST_METHOD(Simple_Counting_0) {
            Assert::AreEqual(0, test("simple_counting/0"));
        }
        TEST_METHOD(Simple_Counting_1) {
            Assert::AreEqual(1, test("simple_counting/1"));
        }
        TEST_METHOD(Simple_Counting_2) {
            Assert::AreEqual(2, test("simple_counting/2"));
        }
        TEST_METHOD(Simple_Counting_512) {
            Assert::AreEqual(512, test("simple_counting/512"));
        }
    };

/*
    Count_2 tests should always answer 2 - the test folders have audio files and text
    files in differing order.

*/
    TEST_CLASS(Count_2)
    {
    public:
        TEST_METHOD(test_1_after) {
            Assert::AreEqual(2, test("2_with_other_files/1_after"));
        }
        
    };
}
/*
    |---------------------------------------------------------------------------------------------|
    | Below here are some helper functions to aid with testing readability                        |
    |---------------------------------------------------------------------------------------------|
*/

Cur_Dir_Info* set_variables() {
    Cur_Dir_Info* output = (Cur_Dir_Info*)malloc(sizeof(Cur_Dir_Info));
    if (!output) {
        fprintf(stderr, "error: output (Cur_Dir_Info) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }
    return output;
}

char* set_path(const char* test_path) {
    std::string project_path = PROJECT_PATH;
    project_path.append(test_path);
    char* full_path = new char[project_path.length()];
    project_path.copy(full_path, project_path.size() + 1);
    full_path[project_path.size()] = '\0';
    return full_path;
}

int test(const char* test_folder) {
    Cur_Dir_Info* output = set_variables();
    char* test_path = set_path(test_folder);
    output = list_and_count(test_path, output);
    return output->audio_file_count;
}