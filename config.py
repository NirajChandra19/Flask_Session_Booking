# config.py
import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    DB_HOST = os.getenv('DB_HOST')
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_NAME = os.getenv('DB_NAME')
