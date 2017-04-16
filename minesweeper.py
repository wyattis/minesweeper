from flask import Flask, render_template
app = Flask(__name__, static_url_path="/minesweeper/static")
app.config['DEBUG'] = True
app.config['APPLICATION_ROOT'] = "/minesweeper"
# app.config['STATIC_FOLDER'] = 'static'
# app.config['STATIC_PATH'] = root + '/static/'
root = "/minesweeper"

@app.route(root + '/')
def home():
    print(app.config)
    return render_template('minesweeper.html')

@app.route(root + '/scores', methods=['POST'])
def post_score():
    pass

@app.route(root + '/scores', methods=['GET'])
def get_scores():
    pass

@app.errorhandler(404)
def page_not_found(e):
    return "page not found", 404