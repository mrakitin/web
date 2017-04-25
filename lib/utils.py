import collections
import json
import os


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
    return data


def _reverse(d):
    return collections.OrderedDict(reversed(list(d.items())))
