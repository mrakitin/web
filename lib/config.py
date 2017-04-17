import datetime
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

# Date format of the last update:
DATE_FORMAT = {
    'iso': '%Y-%m-%d %H:%M:%S %z',
}


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


def _repo_last_update(repo_path='.', status_file='updated', date_format='iso'):
    last_updated = None
    if os.path.isfile(status_file):
        with open(status_file) as f:
            last_updated = _validate_date(
                f.read(),
                date_format=DATE_FORMAT[date_format]
            )
    else:
        try:
            g = git.Git(repo_path)
            last_updated = _validate_date(
                g.log(-1, '--format=%cd', '--date={}'.format(date_format)),
                date_format=DATE_FORMAT[date_format]
            )
        except:
            pass
    return last_updated


def _validate_date(date_text, date_format):
    try:
        return datetime.datetime.strptime(date_text, date_format).strftime(date_format)
    except ValueError:
        return None
