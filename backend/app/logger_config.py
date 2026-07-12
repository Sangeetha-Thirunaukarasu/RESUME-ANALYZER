import logging
from logging.handlers import RotatingFileHandler
import os
from app.config import settings

def setup_production_logging(logger_name: str):
    """Configures centralized console and auto-rotating file handlers for application telemetry."""
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.INFO)
    
    # Avoid duplicate handler stacks if initialized multiple times across module files
    if logger.hasHandlers():
        return logger

    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Handler 1: Standard output stream for container logging runtimes
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Handler 2: Persistent local file logger with a 10MB auto-rotate limit
    try:
        os.makedirs(settings.LOG_DIR, exist_ok=True)
        log_filepath = os.path.join(settings.LOG_DIR, f"{logger_name}.log")
        file_handler = RotatingFileHandler(log_filepath, maxBytes=10*1024*1024, backupCount=5)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        logger.error(f"Failed to bind file subsystem logger handlers: {str(e)}")

    return logger
