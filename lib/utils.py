import collections
import json
import os
import re

import flask


def clear_dashes(s, replace='&ndash;'):
    return re.sub('\s-+', ' {}'.format(replace), s)


def dump_json(d, indent=4, separators=(',', ': '), sort_keys=True):
    return json.dumps(
        d,
        indent=indent,
        separators=separators,
        sort_keys=sort_keys,
    )


def read_json(json_folder, json_file, data_format=None, reverse=True):
    json_file = os.path.join(json_folder, json_file)
    with open(json_file) as f:
        data = json.load(f, object_pairs_hook=collections.OrderedDict)
        if reverse:
            data = _reverse(data)
    if data_format:
        for k in data.keys():
            data[k]['link'] = os.path.join('/static', data_format, data[k]['link'])
    for k in data.keys():
        if 'title' in data[k]:
            data[k]['title'] = flask.Markup(clear_dashes(data[k]['title']))
    return data


def _reverse(d):
    return collections.OrderedDict(reversed(list(d.items())))
