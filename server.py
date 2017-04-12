# -*- coding: utf-8 -*-

import collections
import datetime
import json
import os
import time

import flask
import requests

import weather.weather as w
from lib.bokeh_plot import bokeh_plot
from lib.config import render_template, static_folder, template_folder, json_folder, OWNER, USER

app = flask.Flask(
    __name__,
    static_folder=static_folder,
    template_folder=template_folder,
)
app.register_blueprint(bokeh_plot)


@app.route('/')
def index():
    return render_template(
        'index.html',
        title="Welcome to {}'s web page!".format(OWNER),
        user=USER,
    )


@app.route('/cv')
@app.route('/CV')
def cv(as_attachment=True):
    filename = 'RakitinMS_CV.pdf'
    mimetype = os.path.splitext(filename)[1]
    filepath = os.path.join(os.path.dirname(os.getcwd()), 'CV/{}'.format(filename))
    return flask.send_file(
        filepath,
        as_attachment=as_attachment,
        attachment_filename=filename,
        mimetype='application/{}'.format(mimetype),
    )


@app.route('/ip/')
def ip():
    ip_info = w.get_external_ip(ip=_remote_address())
    return render_template(
        'ip.html',
        title='Your IP info',
        ip_info=ip_info,
        time=_time(),
    )


@app.route('/myweather')
@app.route('/myweather/')
def my_weather():
    remote_addr = _remote_address()
    return render_template(
        'weather.html',
        title='My Weather',
        parameter={'name': 'your IP address', 'value': remote_addr},
        weather=_get_weather(w.get_city_by_ip(remote_addr)),
        time=_time(),
    )


@app.route('/weather')
@app.route('/weather/')
@app.route('/weather/<postal>')
def weather(postal=11767):
    try:
        postal = str(postal)
        return render_template(
            'weather.html',
            title='Weather',
            parameter={'name': 'postal', 'value': postal},
            weather=_get_weather(w.get_city_by_postal(postal)),
            time=_time(),
        )
    except ValueError as e:
        return flask.jsonify({'error': str(e)})


@app.route('/favicon.ico')
def favicon():
    """Routes to favicon.ico file."""
    return flask.send_from_directory(
        os.path.join(static_folder, 'img'),
        'favicon.ico',
        mimetype='image/vnd.microsoft.icon',
    )


@app.route('/points')
def points():
    """REST API proxying from http://theossrv2.epfl.ch/aiida_assignment2/api/points/"""
    url = 'http://theossrv2.epfl.ch/aiida_assignment2/api/points/'
    data = requests.get(url=url)
    try:
        return flask.jsonify(json.loads(data.text))
    except:
        raise ValueError('Server response cannot be converted to JSON.')


@app.route('/presentations')
def presentations():
    """Shows a list of selected presentations"""
    data = _read_json(json_file='presentations.json', data_format='pdf')
    return render_template(
        'table.html',
        title='Presentations',
        data=data,
        target='_self',
    )


@app.route('/projects')
def projects():
    """Shows a list of selected projects"""
    data = _read_json(json_file='projects.json')
    return render_template(
        'table.html',
        title='Projects',
        data=data,
        target='_blank',
    )


@app.route('/robots.txt')
def robots_txt():
    # Allow scans by Google robot:
    return flask.Response('')
    # """Tell robots to go away"""
    # return flask.Response(
    #     'User-agent: *\nDisallow: /\n',
    #     mimetype='text/plain',
    # )


def _as_attachment(response, content_type, filename):
    response.mimetype = content_type
    response.headers['Content-Disposition'] = 'attachment; filename="{}"'.format(filename)
    return response


def _dump_json(d, indent=4, separators=(',', ': '), sort_keys=True):
    return json.dumps(
        d,
        indent=indent,
        separators=separators,
        sort_keys=sort_keys,
    )


def _get_weather(location, debug=False):
    try:
        conditions = w.get_current_conditions(location['Key'], details=True)
    except TypeError:
        raise ValueError('Conditions cannot be found for the remote address {}'.format(_remote_address()))
    w_json = _dump_json(conditions)
    if debug:
        print('Weather: {}'.format(w_json))
    fmt = u'{}'
    return fmt.format(w.printable_weather(
        city=location['EnglishName'],
        state=location['AdministrativeArea']['ID'],
        postal=location['PrimaryPostalCode'],
        conditions=conditions,
        no_icons=False,
    ))


def _read_json(json_file, data_format=None):
    json_file = os.path.join(json_folder, json_file)
    with open(json_file) as f:
        data = json.load(f, object_pairs_hook=collections.OrderedDict)
        data = collections.OrderedDict(reversed(list(data.items())))
    if data_format:
        for k in data.keys():
            data[k]['link'] = os.path.join('/static', data_format, data[k]['link'])
    return data


def _remote_address():
    if flask.request.headers.getlist("X-Forwarded-For"):
        remote_addr = flask.request.headers.getlist("X-Forwarded-For")[0]
    else:
        remote_addr = flask.request.remote_addr
    if remote_addr == '127.0.0.1':
        remote_addr = w.get_external_ip()['ip']
    return remote_addr


def _time(time_format='%Y-%m-%d %H:%M:%S'):
    timestamp = time.time()
    return datetime.datetime.fromtimestamp(timestamp=timestamp).strftime(time_format)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Web server')
    parser.add_argument('-d', '--debug', dest='debug', action='store_true',
                        help='debug mode')
    args = parser.parse_args()

    host = '127.0.0.1' if args.debug else '0.0.0.0'
    app.run(
        debug=args.debug,
        host=host,
    )
