Act as an experienced software developer tasked with creating an application based on the following description. Just generate the code and allow me to download it.

### Tokungaku – Web App Requirements

Tokungaku is a web application that allows users to draw notes on top of their images to capture music sequences from their memories.

## UI / Use Case

* There is an area with a fixed width of 960 px and variable height.
* The user can upload an image to that area; the image is displayed to fill the area while keeping the aspect ratio.
* The user can replace or delete the image.
* Over the image, a grid is displayed.
* The grid represents a "piano-roll" sequencer used for scoring the music.
* The grid has 36 rows, allowing the user to add a 3-octave range of notes.
* The number of columns is 32 in a 4/4 time signature, but the user can define their own. The maximum limit is 64 steps (columns).
* The user can place notes on the grid by clicking anywhere on the image; the note is automatically aligned to the nearest grid cell.
* The notes can be adjusted – the user can increase or decrease the length by dragging or clicking the plus/minus icon.
* Notes can be deleted.
* The minimum length of a note is 1 column; the maximum is not defined.
* Notes are movable, so the user can move them to another place.
* The user can set the BPM and play the sequence (use simple MIDI sounds if available).
* The user can export the notation as a MIDI file.

## Details

* The application is a web app.
* The application doesn't require a server.
* All settings, images, notes, etc., are stored locally by the browser, so the user can return to their work.
* The application should be split into particular files for HTML, CSS, JavaScript, etc., to allow further refactoring or maintainability.
* If possible, allow the user to use shortcuts – just by pressing keys:
* a = add new note (the new note is placed in the center if no note is currently selected, or next to the selected note, if it fits there)
* d = delete selected notes
* w = increase selected note length
* s = decrease selected note length
* arrow keys = move selected note

## Name Origin

The application name is Tokungaku, based on Japanese words:
* Ongaku (音楽) = Music
* Tokuten (得点) = Scoring / Notes / Marks

## Development notes

* Focus on delivering high-quality, maintainable code with readability as a top priority.
* Ensure the code is structured in a way that makes future refactoring easy.
* Write clear, detailed comments to explain logic and decisions made throughout the code.
* Organize the code with a clean and clarified file structure, keeping different functionalities modular.
* Follow best practices in naming conventions, code formatting, and documentation.
* The solution should be flexible for future updates and scalable if the application needs to grow.
* Implement error handling and logging where necessary.
* Keep the overall architecture simple but efficient, avoiding unnecessary complexity.