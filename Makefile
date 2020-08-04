build:
	docker build -t astar .

run:
	docker run -p 8080:8080  --name astar -d astar

stop:
	docker stop astar
	docker rm astar