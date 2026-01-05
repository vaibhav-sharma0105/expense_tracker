import sqlite3
import os

# Define database path
DB_PATH = "expenses.db"

def migrate():
    # Check if DB exists
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found. Skipping migration (tables will be created fresh).")
        return

    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check columns in transactions table
    cursor.execute("PRAGMA table_info(transactions)")
    columns = [info[1] for info in cursor.fetchall()]

    if "comment" not in columns:
        print("Adding 'comment' column to 'transactions' table...")
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN comment TEXT")
            conn.commit()
            print("Migration successful.")
        except Exception as e:
            print(f"Migration failed: {e}")
    else:
        print("'comment' column already exists.")

    conn.close()

if __name__ == "__main__":
    migrate()
