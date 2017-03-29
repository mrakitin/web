# -*- coding: utf-8 -*-

import datetime
import json
import os
import time

import flask

import weather.weather as w

app = flask.Flask(__name__)

OWNER = 'Maksim Rakitin'
USER = 'guest'


@app.route('/')
def index():
    ip_info = w.get_external_ip(ip=_remote_address())
    return flask.render_template(
        'index.html',
        owner=OWNER,
        user=USER,
        ip_info=ip_info,
        time=_time(),
    )


@app.route('/cv')
@app.route('/CV')
def cv(as_attachment=False):
    filename = 'RakitinMS_CV.pdf'
    mimetype = os.path.splitext(filename)[1]
    filepath = os.path.join(os.path.dirname(os.getcwd()), 'CV/{}'.format(filename))
    return flask.send_file(
        filepath,
        as_attachment=as_attachment,
        attachment_filename=filename,
        mimetype='application/{}'.format(mimetype),
    )


@app.route('/myweather')
@app.route('/myweather/')
def my_weather():
    remote_addr = _remote_address()
    return flask.render_template(
        'weather.html',
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
        return flask.render_template(
            'weather.html',
            parameter={'name': 'postal', 'value': postal},
            weather=_get_weather(w.get_city_by_postal(postal)),
            time=_time(),
        )
    except ValueError as e:
        return flask.jsonify({'error': str(e)})


@app.route('/robots.txt')
def robots_txt():
    """Tell robots to go away"""
    return flask.Response(
        'User-agent: *\nDisallow: /\n',
        mimetype='text/plain',
    )


def _as_attachment(response, content_type, filename):
    response.mimetype = content_type
    response.headers['Content-Disposition'] = 'attachment; filename="{}"'.format(filename)
    return response


def _get_weather(location, debug=False):
    try:
        conditions = w.get_current_conditions(location['Key'], details=True)
    except TypeError:
        raise ValueError('Conditions cannot be found for the remote address {}'.format(_remote_address()))
    w_json = json.dumps(
        conditions,
        indent=4,
        separators=(',', ': '),
        sort_keys=True,
    )
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
