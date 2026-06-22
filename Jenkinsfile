pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code checked out from GitHub'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
                echo 'Dependencies installed'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                bat 'npx prisma generate'
                echo 'Prisma client generated'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
                echo 'Build completed successfully'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
