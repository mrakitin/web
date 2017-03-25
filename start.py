import datetime
import json
import os
import time

import flask

from weather import get_city_by_postal, get_city_by_ip, get_current_conditions, printable_weather

app = flask.Flask(__name__)


@app.route('/')
def index():
    timestamp = time.time()
    time_format = '%Y-%m-%d %H:%M:%S'
    return """Hello World!<br>
{}
""".format(datetime.datetime.fromtimestamp(timestamp=timestamp).strftime(time_format))


@app.route('/robots.txt')
def robots_txt():
    """Tell robots to go away"""
    return flask.Response(
        'User-agent: *\nDisallow: /\n',
        mimetype='text/plain',
    )


@app.route('/cv')
@app.route('/CV')
def cv(as_attachment=False):
    filename = 'RakitinMS_CV.pdf'
    filepath = os.path.join(os.path.dirname(os.getcwd()), 'CV/{}'.format(filename))
    return flask.send_file(filepath, as_attachment=as_attachment, attachment_filename=filename)


@app.route('/myweather')
def my_weather():
    location = get_city_by_ip(flask.request.remote_addr)
    conditions = get_current_conditions(location['Key'], details=True)
    w = json.dumps(
        conditions,
        indent=4,
        separators=(',', ': '),
        sort_keys=True,
    )
    city = location['EnglishName']
    state = location['AdministrativeArea']['ID']
    postal = location['PrimaryPostalCode']
    w = printable_weather('', city, state, postal, conditions[0])

    # print('\n\n=== {}\n\n'.format(w))
    return '<pre>{}</pre>'.format(w)


@app.route('/weather')
@app.route('/weather/<postal>')
def weather(postal=11767):
    location = get_city_by_postal(str(postal))
    conditions = get_current_conditions(location['Key'], details=True)
    w = json.dumps(
        conditions,
        indent=4,
        separators=(',', ': '),
        sort_keys=True,
    )
    city = location['EnglishName']
    state = location['AdministrativeArea']['ID']
    postal = location['PrimaryPostalCode']
    return printable_weather('', city, state, postal, conditions[0])


def _as_attachment(response, content_type, filename):
    response.mimetype = content_type
    response.headers['Content-Disposition'] = 'attachment; filename="{}"'.format(filename)
    return response


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Web server')
    parser.add_argument('-d', '--debug', dest='debug', action='store_true',
                        help='debug mode')
    args = parser.parse_args()

    localhost = '127.0.0.1'
    host = '0.0.0.0'
    app.run(
        debug=args.debug,
        host=host,
    )
