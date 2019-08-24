#include "pch.h"
#include "CppUnitTest.h"
#include <iostream>
#include "../library_finder/library_finder.h"

//You must provide your LOCAL project path here:
#define PROJECT_PATH "G:/Local Dev Files/library_finder/library_finder/"

using namespace Microsoft::VisualStudio::CppUnitTestFramework;

class make_path {
    std::string project_path = PROJECT_PATH;

public:
    char* set_path(const char* test_path) {
        project_path.append(test_path);
        char* full_path = new char[project_path.length()];
        project_path.copy(full_path, project_path.size() + 1);
        full_path[project_path.size()] = '\0';
        return full_path;
    }
};

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

namespace UnitTest1
{
    TEST_CLASS(Simple_Counting)
    {
    public:

        TEST_METHOD(Simple_Counting_0)
        {
            Cur_Dir_Info* output = set_variables();
            char* test_path = set_path("unit_tests/tests/simple_counting/0");
            output = list_and_count(test_path, output);
            int answer = output->audio_file_count;
            
            Assert::AreEqual(0, answer);
        }
        TEST_METHOD(Simple_Counting_1)
        {
            Cur_Dir_Info* output = set_variables();
            char* test_path = set_path("unit_tests/tests/simple_counting/1");
            output = list_and_count(test_path, output);
            int answer = output->audio_file_count;

            Assert::AreEqual(1, answer);
        }
        TEST_METHOD(Simple_Counting_2)
        {
            Cur_Dir_Info* output = set_variables();
            char* test_path = set_path("unit_tests/tests/simple_counting/2");
            output = list_and_count(test_path, output);
            int answer = output->audio_file_count;

            Assert::AreEqual(2, answer);
        }
    };
}
