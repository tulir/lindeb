.PHONY: clean backend frontend deb tar

default: frontend backend

clean:
	rm -rf packaging/usr/bin packaging/var
	rm -rf frontend/dist
	rm -f lindeb *.deb *.tar.xz *.zip *.xpi

backend:
	go build -o lindeb

frontend:
	cd frontend; \
		npm run build


deb: backend frontend
	mkdir -p packaging/var/www packaging/usr/bin
	mv frontend/dist packaging/var/www/lindeb
	mv lindeb packaging/usr/bin/lindeb

	dpkg-deb --build packaging lindeb_1.0.0-1.deb

tar: frontend backend
	mkdir packaging-tmp

	mv frontend/dist packaging-tmp/frontend
	mv lindeb packaging-tmp
	cp example-config.yaml packaging-tmp/config.yaml
	cp LICENSE packaging-tmp/

	cd packaging-tmp; \
		tar cvfJ lindeb-1.0.0.tar.xz *
	mv packaging-tmp/*.tar.xz .
	rm -rf packaging-tmp
