#include "pch.h"
#include "CppUnitTest.h"
#include "../library_finder/library_finder.h"

using namespace Microsoft::VisualStudio::CppUnitTestFramework;

namespace UnitTest1
{
	TEST_CLASS(UnitTest1)
	{
	public:
		
		TEST_METHOD(TestMethod1)
		{
            Cur_Dir_Info* output = (Cur_Dir_Info*)malloc(sizeof(Cur_Dir_Info));
            if (!output) {
                fprintf(stderr, "error: output (Cur_Dir_Info) allocation failed, exiting.\n");
                exit(EXIT_FAILURE);
            }
            int answer;

            output = list_and_count("G:\\Local Dev Files\\library_finder\\library_finder\\unit_tests\\tests\\simple_counting\\2", output);
            answer = output->audio_file_count;
            Assert::AreEqual(answer, 2);
		}
	};
}
