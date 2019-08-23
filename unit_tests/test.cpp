#include "pch.h"
#include "../library_finder/library_finder.h"

TEST(Testing, tester) {
    EXPECT_EQ(1, 1);
}

TEST(TestCaseName, TestName) {
    Cur_Dir_Info* output = (Cur_Dir_Info*)malloc(sizeof(Cur_Dir_Info));
    if (!output) {
        fprintf(stderr, "error: output (Cur_Dir_Info) allocation failed, exiting.\n");
        exit(EXIT_FAILURE);
    }
    int answer;

    output = list_and_count("..\\library_finder\\unit_tests\\simple_counting\\0", output);
    answer = output->audio_file_count;
    EXPECT_EQ(answer, 0); 

    output = list_and_count("..\\library_finder\\unit_tests\\simple_counting\\1", output);
    answer = output->audio_file_count;
    EXPECT_EQ(answer, 1);

    output = list_and_count("..\\library_finder\\unit_tests\\simple_counting\\2", output);
    answer = output->audio_file_count;
    EXPECT_EQ(answer, 2);
}