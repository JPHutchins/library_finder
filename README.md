# library_finder
Find potential file libraries on a file system, such as those created by iTunes, Plex or Mac Photos.
## Downloads
[Latest Release](https://github.com/JPHutchins/library_finder/releases)
## Demo
Test user interface here: https://jphutchins.github.io/library_finder/
## Quickstart
library_finder is a command line utility and does not require any further installation or configuration once downloaded. Open a terminal (like Command Prompt or Terminal) and navigate to the folder that you downloaded library_finder to.
```
./library_finder /parent/path_to_search_under
```
Optional flags: 
```
--html - create the library_explorer.html GUI
--type [ audio, video, or photo (defaults to audio) ]
--tolerance [ number of non-target-type files to allow before skipping the folder ]
--files - include the filenames in the output list - could be a lot!
--help
```

Example Windows Usage: `.\library_finder D:\Music --html`

If you have trouble searching from the root of the drive try including a trailing slash: `C:\` instead of just `C:`.

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

Began as a project in C in an effort for it to be cross-platform ready.
Became a C++ project when I realized my implementation of regular expression matching was *probably*
not going to be as good as the C++ &lt;regex&gt;.  This is particularly relevant because it eats most of the
CPU time.

