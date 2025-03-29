import os
from flask import Flask, render_template, request, redirect, url_for, abort, send_from_directory, flash
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import login_user, LoginManager, UserMixin, login_required, current_user, logout_user

# initialize flask app
app = Flask(__name__)

# image upload configurations
app.config['MAX_CONTENT_LENGTH'] = 8000000 # 8 MB file limit
app.config['UPLOAD_EXTENSIONS'] = ['.jpg', '.png', '.webp', '.avif']
app.config['UPLOAD_PATH'] = '/var/www/somi/uploads/'

# connect to postgresql
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://somiadmin:sweng2025@localhost/somidb'
# create key for hash
app.config['SECRET_KEY'] = '123'
# initialize SQLAlchemy
db = SQLAlchemy(app)
# initialize bcrypt
bcrypt = Bcrypt(app)
# initialize flask_login
login_manager = LoginManager()
login_manager.init_app(app)

#######################################################################################################

###########################
###   BEGIN POSTGRESQL  ###
###########################

# User
class User(UserMixin, db.Model):
    
    __tablename__='Users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(128), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

##########################
###   END POSTGRESQL   ###
##########################

#######################################################################################################

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# validates user submitted password against the hash in the database
def authenticate(username, login_password):
  
    database_hashed_password = User.query.filter_by(username=username).first().password
    return bcrypt.check_password_hash(database_hashed_password, login_password)

#######################################################################################################

###########################
###     BEGIN ROUTES    ###
###########################

#####################################################################
#                        user homepage/canvas                       #
#####################################################################

@app.route('/home')
@login_required
def home():
    
    # user id of user currently logged in
    user_id = current_user.id
    # /uploads/<user_id>
    user_directory = os.path.join(app.config['UPLOAD_PATH'], str(user_id))


    if not os.path.exists(user_directory):
        return render_template('home.html', files="")

    # get all files in user directory 
    files = os.listdir(user_directory)
    #render canvas and all files
    return render_template('home.html', files=files)

#####################################################################
#                        account registration                       #
#####################################################################

@app.route('/register', methods=['GET', 'POST'])
def register():
    
    # if user is already logged in, redirect to homepage
    if current_user.is_authenticated:
        return redirect(url_for('home'));

    # when the user inputs data
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

        # redirect to login page
        flash('Account created successfully.')
        return redirect(url_for('login'))

    # if GET, load the register page
    return render_template('register.html')

#####################################################################
#                              login                                #
#####################################################################

@app.route('/login', methods=['GET', 'POST'])
def login():
    
    # handle user submitted login credentials
    if request.method == 'POST':
        
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()

        # validate user exists in database and password is correct
        if user and authenticate(username, password):
            login_user(user)
            return redirect(url_for('home'))
    
        # authentication failed, redirect back to login
        flash('Error: incorrect username or password. Please try again.')
        return redirect(url_for('login'))

    # if GET, load login page
    return render_template('login.html')

#####################################################################
#                              logout                               #
#####################################################################

@app.route('/logout', methods=['POST'])
@login_required
def logout():

    # logout and redirect to login page
    logout_user()
    return redirect(url_for('login'))

#####################################################################
#                              index                                #
#####################################################################

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

#####################################################################
#                          image uploads                            #
#####################################################################

@app.route('/upload', methods=['POST'])
@login_required
def upload_files():
   
    # get user id
    user_id = current_user.id
    
    # wait for user to upload file on website
    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)

    # if file exists, 
    if filename != '':
        
        # validate file extension
        file_ext = os.path.splitext(filename)[1]
        if file_ext not in app.config['UPLOAD_EXTENSIONS']:
            flash('Error: file extension not allowed.')
            abort(400)
    
        # uploads/<user_id>/
        usr_upload_directory = (os.path.join(app.config['UPLOAD_PATH'], str(user_id)))
        # make user directoy if it doesn't already exist
        if not os.path.exists(usr_upload_directory):
            os.makedirs(usr_upload_directory)
        
        # uploads/<user_id>/<filename>
        filepath = os.path.join(usr_upload_directory, filename)
        # upload file to user directory
        uploaded_file.save(filepath)
        flash('File uploaded successfully.');

    return redirect(url_for('index'))

# New route to serve uploaded images
@app.route('/uploads/<user_id>/<filename>')
@login_required
def uploaded_file(user_id, filename):

    # get user directory
    usr_directory = os.path.join(app.config['UPLOAD_PATH'], str(user_id))
    # serve the image
    return send_from_directory(usr_directory, filename)

###########################
###      END ROUTES     ###
###########################

#####################################################################

if __name__ == ("__main__"):
    app.run(debug=True)
