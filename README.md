# library_finder
Find potential file libraries on a file system, such as those created by iTunes, Plex or Mac Photos.

## Quickstart

Usage:
```
library_finder.exe /parent/path_to_search_under
```
Optional flags: 
`--type [ audio, video, or photo (defaults to audio) ]`
`--tolerance [ number of non-target-type files to allow before skipping the folder ]`
`--help`

Try it on root: ```library_finder.exe D:\.```

### Compile in Visual Studio 2019  
#### For an .exe:
  From Solution Explorer, drop down library_finder and open library_finder.cpp
  Drop down Project and select library_finder Properties
  Under Configuration Properties->General, under Projec Defaults, verify that
    Configuration Type is set to Application (.exe)
#### For unit testing:
  Complete the steps above but verify that Configuraiton Type is set to
    Static library (.lib)

## Motivation

Part of my work involves providing data management services to private clients.  One of the issues
that is often run into is the desire to upgrade to a new computer and perhaps integrate their media
libraries into a network attached storage solution or cloud backup in the process.  This can be a
tedious process even with the aid of OS filesystem indexing and command line tools - all too often
I will find myself scrolling through lists of family photos spread across multiple drives to comfort
myself that I am not going to lose my clients old iTunes libraries with 500 CD rips or the
high resolution captures they had made of their historic family photo album.  This tool seeks to
direct that hunt and provide peace of mind upon completion of a massive media data consolidation and
de-duplication.

Began as a project in C in an effort for it to be cross-platform ready (so far only tested in Windows).
Became a C++ project when I realized my implementation of regular expression matching was *probably*
not going to be as good as the C++ &lt;regex&gt;.  This is particularly relevant because it eats most of the
CPU time.

