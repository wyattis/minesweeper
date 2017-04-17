from flask import Flask, render_template
app = Flask(__name__, static_url_path="/minesweeper/static")
app.config['DEBUG'] = True
root = "/minesweeper"
# root = ""

@app.route(root + '/')
def home():
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