VERSION = $(shell cat package.json | sed -n 's/.*"version": "\([^"]*\)",/\1/p')

SHELL = /usr/bin/env bash

default: build
.PHONY: ig_backbone ig_backgrid test build ig_backbone_bundle ig_backgrid_bundle backbone backgrid backgrid_mini

 
build: backbone backgrid

version:
	@echo $(VERSION)

install: 
	npm install
	jspm install


test:
	grunt karma

backbone: 	ig_backbone 	ig_backbone_bundle

backgrid: 	ig_backgrid 	ig_backgrid_bundle

ig_backbone:
	jspm build src/ig_backbone dist/ig_backbone.js --format esm --skip-source-maps --skip-encode-names

ig_backbone_bundle:	
	jspm build src/ig_backbone dist/ig_backbone.bundle.js --format umd --skip-encode-names --global-name window 

	
	
ig_backgrid:
	jspm build src/ig_backgrid dist/ig_backgrid.js --format esm --skip-source-maps --skip-encode-names  --config jspm.backgrid.amd.json  --global-deps '{"backbone":"Backbone"}' 

ig_backgrid_bundle:	
	jspm build src/ig_backgrid dist/ig_backgrid.bundle.js  --format umd --skip-encode-names --global-name window --config jspm.backgrid.amd.json  --global-deps '{"backbone":"Backbone"}' 


 
update_version:
ifeq ($(shell expr "${VERSION}" \> "$(v)"),1)
	$(error "v" parameter is lower than current version ${VERSION})
endif
ifeq ($(v),)
	$(error v is undefined)
endif
ifeq (${VERSION},$(v))
	$(error v is already the current version)
endif
	@echo "Current version is " ${VERSION}
	@echo "Next version is " $(v)
	sed -i s/"$(VERSION)"/"$(v)"/g package.json

tag_and_push:
		git add --all
		git commit -a -m "Tag v $(v) $(m)"
		git tag v$(v)
		git push
		git push --tags

tag: update_version build tag_and_push		

release: update_version tag_and_push