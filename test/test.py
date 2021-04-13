from flask import Flask, render_template, request

# Initialize Flask app
app = Flask(__name__)


@app.route("/", methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        # return "SUCCESS"
        return "FAIL"

    return render_template("index.html")


# Run Website..
if __name__ == "__main__":
    app.run(debug=True)