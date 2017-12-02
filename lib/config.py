# -*- coding: utf-8 -*-

import collections
import glob
import os
import re

import dateutil.parser
import flask
import git

from lib.utils import read_json

STATIC_FOLDER = os.path.abspath('static')
TEMPLATE_FOLDER = os.path.join(STATIC_FOLDER, 'html')
JSON_FOLDER = os.path.join(STATIC_FOLDER, 'json')
CV_FOLDER = os.path.join(os.path.dirname(os.getcwd()), 'CV')
OWNER = 'Maksim Rakitin'
ALT_NAMES = ['Maxim Rakitin']
BIB_NAMES = ['Rakitin, Maksim', 'Rakitin, Maksim S.', 'Rakitin, M. S.', 'Maksim S. Rakitin', 'M.S. Rakitin',
             'M. Rakitin', 'M. S. Rakitin', 'Maksim Rakitin']
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

# CV-related vars:
AUTHOR = 'RakitinMS'
CV_TEX = '{}_CV.tex'.format(AUTHOR)
CV_PDF = '{}_CV.pdf'.format(AUTHOR)
PUB_TEX = '{}_pubs.tex'.format(AUTHOR)
PUB_PDF = '{}_pubs.pdf'.format(AUTHOR)
PUB_BIB = '{}_pubs.bib'.format(AUTHOR)
BIO_PDF = '{}_bio.pdf'.format(AUTHOR)

# Date format of the last update:
DATE_FORMAT = {
    'iso': '%Y-%m-%d %H:%M:%S %z',
}
PRESENTATIONS = read_json(json_folder=JSON_FOLDER, json_file='presentations.json', data_format='pdf')
PROJECTS = read_json(json_folder=JSON_FOLDER, json_file='projects.json')
SOCIAL = read_json(json_folder=JSON_FOLDER, json_file='social.json', reverse=False)
ETC = read_json(json_folder=JSON_FOLDER, json_file='etc.json', reverse=False)


def get_cv_pdfs():
    # Map short names from pdfs list to file names:
    pdf_files = glob.glob(os.path.join(CV_FOLDER, '*.pdf'))
    pdf_map = {}
    for f in pdf_files:
        s = os.path.splitext(os.path.basename(f))[0].split('_')[1]
        pdf_map[s.lower()] = {
            'file': f,
            'orig_name': s,
        }

    # Map short names from CV sections file to long names:
    cv_sections = get_cv_sections()

    # Merge two maps:
    d = collections.OrderedDict({})
    for s in cv_sections.keys():
        if s in pdf_map.keys():
            d[s] = dict([('long_name', cv_sections[s])] + pdf_map[s].items())

    # Add bib-file details manually:
    d['bib'] = {
        'long_name': 'BibTeX file',
        'orig_name': 'bib',
        'file': os.path.join(CV_FOLDER, PUB_BIB)
    }

    # Add bio-file details manually:
    d['bio'] = {
        'long_name': 'Short bio',
        'orig_name': 'bio',
        'file': os.path.join(CV_FOLDER, BIO_PDF)
    }
    return d


def get_cv_sections():
    cv_sections = os.path.join(CV_FOLDER, 'src/sections.tex')
    with open(cv_sections) as f:
        content = f.readlines()
    d = collections.OrderedDict({})
    for c in content:
        if not re.search('^%', c):
            s = c.split('\\')[2]
            short_name = s.split('{')[0]
            long_name = s.split('{')[1].split('}')[0]
            d[short_name] = long_name
    return d


def render_template(*args, **kwargs):
    if 'owner' not in kwargs.keys():
        kwargs['owner'] = OWNER
    if 'keywords' not in kwargs.keys():
        kwargs['keywords'] = KEYWORDS
    if 'title' not in kwargs.keys():
        kwargs['title'] = TITLE
    if 'last_updated' not in kwargs.keys():
        kwargs['last_updated'] = _repo_last_update()
    kwargs['social'] = SOCIAL
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
        return dateutil.parser.parse(date_text).strftime(date_format)
    except ValueError:
        return None
