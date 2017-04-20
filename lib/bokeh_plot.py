# -*- coding: utf-8 -*-

import flask
from bokeh.embed import components
from bokeh.plotting import figure
from bokeh.resources import INLINE
from bokeh.util.string import encode_utf8

from lib.config import render_template, STATIC_FOLDER, TEMPLATE_FOLDER

colors = {
    'Black': '#000000',
    'Red': '#FF0000',
    'Green': '#00FF00',
    'Blue': '#0000FF',
}

bokeh_plot = flask.Blueprint('bokeh_plot', __name__, static_folder=STATIC_FOLDER, template_folder=TEMPLATE_FOLDER)


@bokeh_plot.route('/bokeh')
def polynomial():
    """ Very simple embedding of a polynomial chart
    """

    # Grab the inputs arguments from the URL
    args = flask.request.args

    # Get all the form arguments in the url with defaults
    color = getitem(args, 'color', 'Red')
    _from = int(getitem(args, '_from', -100))
    to = int(getitem(args, 'to', 100))

    # Create a polynomial line graph with those arguments
    x = list(range(_from, to + 1))
    fig = figure(title="Polynomial")
    fig.line(x, [i ** 2 for i in x], color=colors[color], line_width=2)

    js_resources = INLINE.render_js()
    css_resources = INLINE.render_css()

    script, div = components(fig)
    html = render_template(
        'embed.html',
        title='Bokeh example',
        plot_script=script,
        plot_div=div,
        js_resources=js_resources,
        css_resources=css_resources,
        color=color,
        _from=_from,
        to=to
    )
    return encode_utf8(html)


def getitem(obj, item, default):
    if item not in obj:
        return default
    else:
        return obj[item]
