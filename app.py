import os
from flask import Flask, render_template, request, redirect, url_for, abort, send_from_directory, flash, 
from werkzeug.utils import secure_filename
from flask_bcrypt import Bcrypt
app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 8000000 # 8 MB file limit
app.config['UPLOAD_EXTENSIONS'] = ['.jpg', '.png', '.webp', '.avif']
app.config['UPLOAD_PATH'] = 'uploads'

#####################################################################
#                           landing page                            #
#####################################################################

@app.route('/')
def index():

    files = os.listdir(app.config['UPLOAD_PATH'])
    return render_template('index.html', files=files)

#####################################################################
#                        account registration                       #
#####################################################################

@app.route('/register', methods=['GET', 'POST'])
def register():

    # when the user sends the data
    if request.method == 'POST':
    
        username = request.form['username']
        password = request.form['password']
    
        # handle situation where user already exists 
        if (User.query.filter_by(username=username).first()):
            flash('User already exists.')
            return redirect(url_for('register'))

        # hash the password
        hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # add user to database
        user = User(username=username, password=hash)
        db.session.add(user)
        db.session.commit()

        # redirect to homepage
        flash('Account created successfully.')
        return redirect(url_for('login'))

    # if GET, load the register page
    return render_template('register.html')

#####################################################################
#                              login                                #
#####################################################################

@app.route('/login')
def login():

    if request.method == 'POST':
    
        return render_template('home.html')

    return render_template('login.html')

#####################################################################
#                          user homepage                            #
#####################################################################

app.route('/home')
def home():

    return render_template('home.html')

#####################################################################
#                          image uploads                            #
#####################################################################

@app.route('/upload', methods=['POST'])
def upload_files():

    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)

    if filename != '':

        file_ext = os.path.splitext(filename)[1]

        if file_ext not in app.config['UPLOAD_EXTENSIONS']:

            abort(400)

        uploaded_file.save(os.path.join(app.config['UPLOAD_PATH'], filename))

    return redirect(url_for('index'))

# New route to serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):

    return send_from_directory(app.config['UPLOAD_PATH'], filename)


#####################################################################

if __name__ == ("__main__"):
    app.run(debug=True)

