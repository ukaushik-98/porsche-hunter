Markup: #Porsche Hunter#

Project:
Create a NodeJS backend that handles an IOS device's inputs to do the following:
    - Create a new user
    - Log in as a new user
    - Create new posts which include:
        - Images of a Porsche car
        - Model of the Car
        - Type of the car
        - Loction where the car was found
    - Users should be able to view, update, and delete their posts

Design Philosophy:
    - Create a sessionless, RESTful API
        - Allow the possibility of horizontal scaling
        - Make routes indepndent of user and more robust in terms of security
        - Introduce statelessness and avoid implementing sticky sessions
    - Reduce information users can get about themselves from a token
        - Token only has user's id
    - Create service that could be easily decoupled and scaled in the future
    - Keep the future additions such as cloud storage (e.g. Amazon S3's) a viable option
    - Identify and simplify potential object relationships for the future
        - Helps scaling and keeps hierarchies and dependencies clean

Routes:
    - Users:
        - GET "/api/users": Get all users <- test route
        - GET "/api/users/:id": Get user by ID <- test route
        - POST "/api/users": Create new user -> returns a token
    - Hunts:
        - GET "/api/hunts": Get all hunts <- test route
        - GET "/api/hunts/user": Get all hunts by user -> id taken by token
        - POST "/api/hunts": Create new hunt for user -> id taken by token
        - PUT "api/hunts/:id": Update a hunt by id -> validates if user owns hunt
        - DELETE "api/hunts/:id": Delete a hunt by id -> validates if user owns hunt
    - Authentication:
        - GET "/api/auth": Get user from passed token -> test route
        - POST "/api/auth": Creates a new auth token for user if valid
    

Potential Vulnerabilities or Errors:
    - JWT's secret token could be leaked!
    - Improve password encryption's strength
    - Users can input random locations or cars 
        - Nothing validates that what they've inputed is actually a Porsche

Project Specs:
    - NodeJS: base of the API
    - ExpressJS: framework with inbuilt validation and parsing services
    - JWT: token that holds user's id and is responsible for not only user authentication but also CRUD
    - BycryptJS: Hashes password for security
    - Middleware:
        - Self created authentication via JWT and BcryptJS
        - Multer for image processing AND parsing form-data OR form-data AND JSON
    - Nodemon for immediate server updates during development
    - Morgan for route information and time specs
    - Postgres

Tools Used:
    - Postman - for calls
    - PGAdmin - view DB
    - Ubuntu via WSL2 (Windows Subsystem for Linux)

Future:
    - Include a React or React Native Client! (in development right now)
    - AWS Cloud Integration:
        - Push image uploads into S3
        - Decouple and add SQS (Simple Queue Service) for scalability
        - Host Postgres on Amazon RDS
    - Data Validation:
        - Use Google Maps API to get user's live location OR authenticate whether input is valid
        - Gather all Porsche car data to validate user input 
    - Add AI to validate if image is really a Porsche
