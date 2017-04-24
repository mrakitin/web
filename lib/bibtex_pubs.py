# -*- coding: utf-8 -*-

import collections
import os
import re

import flask
import pybtex.bibtex
import pybtex.database
import pybtex.richtext

from lib.config import render_template, STATIC_FOLDER, TEMPLATE_FOLDER, CV_FOLDER, PUB_BIB, BIB_NAMES

bibtex_pubs = flask.Blueprint('bibtex_pubs', __name__, static_folder=STATIC_FOLDER, template_folder=TEMPLATE_FOLDER)


@bibtex_pubs.route('/publications')
@bibtex_pubs.route('/publications/')
@bibtex_pubs.route('/publications/<version>')
def publications(version='short'):
    """Shows a list of publications"""

    if version in ['short', 'long']:
        first_letters_only = True if version == 'short' else False
    else:
        first_letters_only = True  # short by default

    bib_file = os.path.join(CV_FOLDER, PUB_BIB)
    bib_database = pybtex.database.parse_file(bib_file)
    data = collections.OrderedDict({})
    entries = bib_database.entries
    for i, k in enumerate(entries):
        p = entries[k]
        e = p.fields
        s = e['title']
        s = pybtex.richtext.String(s).render_as('html')
        for t in ['textit', 'emph']:
            s = re.sub(_latex_tag(t), '<em>\g<formatted_text></em>', s)
        s = re.sub(_latex_tag('textbf'), '<b>\g<formatted_text></b>', s)
        s = re.sub(_latex_formula('_'), '<sub><em>\g<formula_text></em></sub>', s)
        s = re.sub(_latex_formula('^'), '<sup><em>\g<formula_text></em></sup>', s)
        s = re.sub(_latex_formula(''), '<em>\g<formula_text></em>', s)
        s = re.sub(_latex_block(), '\g<block_text>', s)
        s = _clear_dashes(s)
        authors = _format_authors(p.persons, first_letters_only=first_letters_only)
        pub_type = e['journal'] if 'journal' in e.keys() else p.type.capitalize()
        volume = '<b>{}</b>, '.format(e['volume']) if 'volume' in e.keys() else ''
        pages = '{} '.format(e['pages']) if 'pages' in e.keys() else ''
        comma = ',' if 'volume' in e.keys() else ''
        journal = _clear_dashes('<em>{}</em>{} {}{}({})'.format(pub_type, comma, volume, pages, e['year']))
        data[k] = {
            'id': len(entries) - i,
            'year': flask.Markup(_clear_dashes(e['year'])),
            'title': flask.Markup(s),
            'link': e['url'],
            'authors': flask.Markup(authors),
            'journal': flask.Markup(journal),
            'key': 'year',
        }
    # data = _reverse(data)  # it's already sorted as necessary
    uri = flask.request.path
    kwargs = {
        'button_short': 'btn-primary',
        'button_long': 'btn-secondary',
    }
    if uri == '/publications/long':
        kwargs['button_short'] = 'btn-secondary'
        kwargs['button_long'] = 'btn-primary'
    return render_template(
        'table.html',
        title='Publications',
        data=data,
        target='_blank',
        **kwargs
    )


def _boldify_author(s, a):
    return s.replace(a, '<b>{}</b>'.format(a))


def _clear_dashes(s, replace='&ndash;'):
    return s.replace('--', '-').replace('-', replace)


def _format_authors(p, first_letters_only):
    authors_list = []
    if 'author' in p.keys():
        for a in p['author']:
            last_names = _render_names(a.rich_last_names)
            first_names = _render_names(a.rich_first_names, first_letters_only=first_letters_only)
            middle_names = _render_names(a.rich_middle_names, first_letters_only=first_letters_only)
            if not middle_names:
                name_format = '{} {}'
                l = [first_names, last_names]
            else:
                name_format = '{} {} {}'
                l = [first_names, middle_names, last_names]
            authors_list.append(name_format.format(*l))
    authors = ', '.join(authors_list)
    for name in BIB_NAMES:
        authors = _boldify_author(authors, name)
    return authors


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
                (?P<formatted_text>([^{}]*{[^{}]*})*.*?)
                }''', re.VERBOSE)


def _render_names(names, first_letters_only=False, sep='-'):
    if not names:
        return ''
    if not first_letters_only:
        return ' '.join([x.render_as('text') for x in names])
    else:
        processed_names = []
        for n in names:
            n = n.render_as('text')
            if re.search(sep, n):
                n = n.split(sep)
                r = []
                for p in n:
                    r.append(p[0])
                r = '.-'.join(r)
            else:
                r = n[0]
            processed_names.append(r)
        return '{}.'.format('. '.join(processed_names))
