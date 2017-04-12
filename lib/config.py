import os

import flask

static_folder = os.path.abspath('static')
template_folder = os.path.join(static_folder, 'html')
json_folder = os.path.join(static_folder, 'json')
OWNER = 'Maksim Rakitin'
ALT_NAMES = ['Maxim Rakitin']
ORGANIZATIONS = ['Brookhaven National Laboratory', 'Stony Brook University', 'SUSU', 'Applied Technologies',
                 'Rocket Software']
TOPICS = ['science', 'physics', 'chemistry', 'software development', 'Python']
KEYWORDS = '{}, {}, {}, {}'.format(
    OWNER,
    ', '.join(ALT_NAMES),
    ', '.join(ORGANIZATIONS),
    ', '.join(TOPICS),
)
USER = 'Guest'
TITLE = OWNER  # default title


def render_template(*args, **kwargs):
    if 'owner' not in kwargs.keys():
        kwargs['owner'] = OWNER
    if 'keywords' not in kwargs.keys():
        kwargs['keywords'] = KEYWORDS
    if 'title' not in kwargs.keys():
        kwargs['title'] = TITLE
    return flask.render_template(*args, **kwargs)
