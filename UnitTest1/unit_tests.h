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

#include "../library_finder/library_finder.h"

Cur_Dir_Info* set_variables();
char* set_path(const char* test_path);
int test(const char* test_folder, unsigned int tolerance);
