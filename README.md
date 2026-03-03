# Warhammer: Old World Utilities

This is a set of web apps and utilities to streamline setting up and playing games of Warhammer: Old World. Please see the usage section for a description of each utility.

## Installation

Place the files in your /html folder and make sure PHP is working on your web server.


## Usage

* **scenarios.php** is a simple PHP page where you can choose a set of scenarios from a dropdown and it will either return a random scenario of that type, or let you choose from a list of those scenarios. The scenarios are displayed as an image, and then an HTML block with the conditions underneath. The code pulls the image and HTML from sub-directories named for each scenario set (Square Based, Homebrew, etc...)

* **templates.php** is a much more complex PHP page that will calculate how many bases in a unit of a certain size are full and partial hits from a 3" , 5" , or flame template. The 3" and 5" templates are straightforward, the hits being calculated from the center of the unit. The flame template is a 'best guess' position that will result in the most full hits, with partials being a secondary consideration.

* **wheel.html** is a simple table that shows how many inches you need to use to wheel 45 and 90 degrees for specific base or unit sizes.

## Notices

All of these utilities were made using the Claude 3.5 LLM. I am not a developer, so if any of the code looks inefficient, or the comments wrong, blame the AI.  
# old-world-apps
