# -*- coding: utf-8 -*-

import datetime
import json
import os
import time

import flask
import requests

import weather.weather as w
from lib.bibtex_pubs import bibtex_pubs
from lib.bokeh_plot import bokeh_plot
from lib.config import render_template, get_cv_pdfs, STATIC_FOLDER, TEMPLATE_FOLDER, PRESENTATIONS, \
    PROJECTS, OWNER, USER, ETC
from lib.utils import dump_json

app = flask.Flask(
    __name__,
    static_folder=STATIC_FOLDER,
    template_folder=TEMPLATE_FOLDER,
)
app.register_blueprint(bokeh_plot)
app.register_blueprint(bibtex_pubs)


@app.route('/')
def index():
    return render_template(
        'index.html',
        title="Welcome to {}'s web page!".format(OWNER),
        user=USER,
    )


@app.route('/cv')
@app.route('/cv/')
def cv():
    data = get_cv_pdfs()
    for k in data.keys():
        if k in ['cv', 'bio']:
            button_type = 'success'
        elif k == 'pubs':
            button_type = 'warning'
        elif k == 'bib':
            button_type = 'info'
        else:
            button_type = 'basic'
        data[k]['button_type'] = button_type
    return render_template(
        'cv.html',
        title="{}'s CV".format(OWNER),
        data=data,
    )


@app.route('/cv/<bib>')
def cv_files(bib=None, as_attachment=True):
    data = get_cv_pdfs()
    valid_values = []
    for k, v in data.items():
        valid_values.append(v['orig_name'])
    if bib not in valid_values:
        return flask.redirect(flask.url_for('cv'))
    cv_file = data[bib.lower()]['file']
    attachment_filename = os.path.basename(cv_file)
    mimetype = 'x-bibtex' if bib == 'bib' else os.path.splitext(cv_file)[1]
    return flask.send_file(
        cv_file,
        as_attachment=as_attachment,
        attachment_filename=attachment_filename,
        mimetype='application/{}'.format(mimetype),
    )


@app.route('/etc')
def etc():
    """Shows a list of interesting projects by other people"""
    return render_template(
        'etc.html',
        title='Useful and interesting projects by other people',
        data=ETC,
        target='_blank',
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
        os.path.join(STATIC_FOLDER, 'img'),
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
    return render_template(
        'table.html',
        title='Presentations',
        data=PRESENTATIONS,
        target='_blank',
    )


@app.route('/projects')
def projects():
    """Shows a list of selected projects"""
    return render_template(
        'table.html',
        title='Projects',
        data=PROJECTS,
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


@app.errorhandler(404)
def page_not_found(e):
    return render_template(
        '404.html',
        title='Page Not Found',
    ), 404


def _as_attachment(response, content_type, filename):
    response.mimetype = content_type
    response.headers['Content-Disposition'] = 'attachment; filename="{}"'.format(filename)
    return response


def _get_weather(location, debug=False):
    try:
        conditions = w.get_current_conditions(location['Key'], details=True)
    except TypeError:
        raise ValueError('Conditions cannot be found for the remote address {}'.format(_remote_address()))
    w_json = dump_json(conditions)
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
    if flask.request.headers.getlist('X-Forwarded-For'):
        remote_addr = flask.request.headers.getlist('X-Forwarded-For')[0]
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
