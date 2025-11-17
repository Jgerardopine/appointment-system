# Database Connection Management
# Demonstrates: Connection Pooling, Resource Management

import asyncpg
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class Database:
    """
    Database connection manager
    Demonstrates: Single Responsibility (manages DB connections only)
    """
    
    def __init__(self, connection_url: str):
        self.connection_url = connection_url
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """
        Create connection pool
        Demonstrates: Resource initialization
        """
        try:
            self.pool = await asyncpg.create_pool(
                self.connection_url,
                min_size=5,
                max_size=20,
                max_queries=50000,
                max_inactive_connection_lifetime=300,
                command_timeout=60
            )
            logger.info("Database connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create database connection pool: {e}")
            raise
    
    async def disconnect(self):
        """
        Close connection pool
        Demonstrates: Resource cleanup
        """
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    def acquire(self):
        """
        Acquire a connection from the pool
        Used with async context manager
        """
        if not self.pool:
            raise RuntimeError("Database pool not initialized. Call connect() first.")
        return self.pool.acquire()
    
    async def execute(self, query: str, *args):
        """
        Execute a query
        """
        async with self.acquire() as connection:
            return await connection.execute(query, *args)
    
    async def fetch(self, query: str, *args):
        """
        Fetch multiple rows
        """
        async with self.acquire() as connection:
            return await connection.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args):
        """
        Fetch a single row
        """
        async with self.acquire() as connection:
            return await connection.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args):
        """
        Fetch a single value
        """
        async with self.acquire() as connection:
            return await connection.fetchval(query, *args)
