# -*- coding: utf-8 -*-

import collections
import os
import re

import flask
import pybtex.bibtex
import pybtex.database
import pybtex.richtext

from lib.config import render_template, STATIC_FOLDER, TEMPLATE_FOLDER, CV_FOLDER, CV_BIB, BIB_NAMES

bibtex_pubs = flask.Blueprint('bibtex_pubs', __name__, static_folder=STATIC_FOLDER, template_folder=TEMPLATE_FOLDER)


@bibtex_pubs.route('/publications')
def publications():
    """Shows a list of publications"""
    bib_file = os.path.join(CV_FOLDER, CV_BIB)
    bib_database = pybtex.database.parse_file(bib_file)
    data = collections.OrderedDict({})
    entries = bib_database.entries
    for k in entries:
        p = entries[k]
        e = p.fields
        s = e['title']
        s = pybtex.richtext.String(s).render_as('html')
        for t in ['textit', 'it']:
            s = re.sub(_latex_tag(t), '<em>\g<emph_text></em>', s)
        s = re.sub(_latex_formula('_'), '<sub><em>\g<formula_text></em></sub>', s)
        s = re.sub(_latex_formula('^'), '<sup><em>\g<formula_text></em></sup>', s)
        s = re.sub(_latex_formula(''), '<em>\g<formula_text></em>', s)
        s = re.sub(_latex_block(), '\g<block_text>', s)
        authors = '{}<br>'.format(
            ', '.join([str(x) for x in p.persons['author']])) if 'author' in p.persons.keys() else ''
        for name in BIB_NAMES:
            authors = _boldify_author(authors, name)
        pub_type = e['journal'] if 'journal' in e.keys() else p.type.capitalize()
        volume = '<b>{}</b>, '.format(e['volume']) if 'volume' in e.keys() else ''
        pages = '{}, '.format(e['pages']) if 'pages' in e.keys() else ''
        place = '{}<em>{}</em>, {}{}({})'.format(authors, pub_type, volume, pages, e['year'])
        data[k] = {
            'place': flask.Markup(_clear_dashes(place)),
            'title': flask.Markup(_clear_dashes(s)),
            'link': e['url'],
            'key': _clear_dashes(e['year'])
        }
    # data = _reverse(data)  # it's already sorted as necessary
    return render_template(
        'table.html',
        title='Publications',
        data=data,
        target='_blank',
    )


def _boldify_author(s, a):
    return s.replace(a, '<b>{}</b>'.format(a))


def _clear_dashes(s):
    return s.replace('--', '-')


def _latex_block():
    return re.compile(u'''{
                (?P<block_text>([^{}]*{[^{}]*})*.*?)
                }''', re.VERBOSE)


def _latex_formula(symbol='_'):
    return re.compile(u'''
                \$''' + symbol + '''
                (?P<formula_text>(.*?))
                \$''', re.VERBOSE)


def _latex_tag(tag):
    return re.compile(u'''
                \\\\''' + tag + '''{
                (?P<emph_text>([^{}]*{[^{}]*})*.*?)
                }''', re.VERBOSE)
