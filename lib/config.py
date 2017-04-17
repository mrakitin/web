import os

import flask
import git

STATIC_FOLDER = os.path.abspath('static')
TEMPLATE_FOLDER = os.path.join(STATIC_FOLDER, 'html')
JSON_FOLDER = os.path.join(STATIC_FOLDER, 'json')
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
    if 'last_updated' not in kwargs.keys():
        kwargs['last_updated'] = _repo_last_update()
    return flask.render_template(*args, **kwargs)


def _repo_last_update(repo_path='.'):
    try:
        g = git.Git(repo_path)
        last_updated = g.log(-1, '--format=%cd', '--date=iso')
    except:
        last_updated = None
    return last_updated
