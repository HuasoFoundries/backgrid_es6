VERSION = $(shell cat package.json | sed -n 's/.*"version": "\([^"]*\)",/\1/p')
current_eslint = $(shell cat package.json | sed -n 's/.*"babel-eslint": "\([^"]*\)",/\1/p')
current_babel_eslint = $(shell cat package.json | sed -n 's/.*"eslint": "\([^"]*\)",/\1/p')

SHELL = /usr/bin/env bash

YELLOW=\033[0;33m
RED=\033[0;31m
WHITE=\033[0m
GREEN=\u001B[32m

default: build
.PHONY: ig_backgrid test build ig_backgrid_bundle  backgrid remove_tag

 
build: 
	$$(npm bin)/rollup -c
	sed -i s/".BackgridES6"/""/g dist/backgrid.js

version:
	@echo $(VERSION)

install: 
	npm install


test:
	$$(npm bin)/karma start


update_eslint:
	@echo  -e "Current eslint is $(GREEN)$(current_eslint)$(WHITE), current babel-eslint is $(GREEN)$(current_babel_eslint)$(WHITE)" ;\
	npm remove --save-dev eslint babel-eslint ;\
	npm install --save-dev eslint babel-eslint


update_version:
	@echo -e "Current version is $(GREEN) ${VERSION} $(WHITE) ";\
	echo -e "Next version will be $(YELLOW) ${v} $(WHITE) ";\
	sed -i s/'"version": "$(VERSION)"'/'"version": "$(v)"'/g package.json ;\


check_version:
ifeq ($(v),)
	$(error v is undefined. You must set a tag name. e.g. make tag v=v1.0.0 or make release v=v1.0.0)
endif
ifeq (${VERSION},$(v))
	$(error v is already the current version)
endif
	$(eval SPLIT_VERSION = $(subst ., ,${VERSION}))
	$(eval NEXT_VERSION := $(subst ., ,${v}))
	$(eval CURRENT_MAJOR := $(word 1,$(SPLIT_VERSION)))
	$(eval CURRENT_MINOR := $(word 2,$(SPLIT_VERSION)))
	$(eval CURRENT_HOTFIX := $(word 3,$(SPLIT_VERSION)))
	$(eval NEXT_MAJOR := $(word 1,$(NEXT_VERSION)))
	$(eval NEXT_MINOR := $(word 2,$(NEXT_VERSION)))
	$(eval NEXT_HOTFIX := $(word 3,$(NEXT_VERSION)))
	$(eval ERROR_HOTFIX := $(shell expr "${CURRENT_HOTFIX}" \> "$(NEXT_HOTFIX)"))
	$(eval ERROR_MAJOR := $(shell expr "${CURRENT_MAJOR}" \> "$(NEXT_MAJOR)"))
	$(eval ERROR_MINOR := $(shell expr "${CURRENT_MINOR}" \> "$(NEXT_MINOR)"))
	$(eval SAFE_MAJOR := $(shell expr "${NEXT_MAJOR}" \> "$(CURRENT_MAJOR)"))
	$(eval SAFE_MINOR := $(shell expr "${NEXT_MINOR}" \> "$(CURRENT_MINOR)"))

	@if [ $(ERROR_MAJOR) == 1 ] ; then \
		echo -e "$(RED)ERROR:$(WHITE) Current Major Version $(GREEN)$(CURRENT_MAJOR)$(WHITE).$(CURRENT_MINOR).$(CURRENT_HOTFIX) is higher than proposed version $(RED)$(NEXT_MAJOR)$(WHITE).$(NEXT_MINOR).$(NEXT_HOTFIX)" ;\
	    exit 1;\
   	else \
		if [ $(SAFE_MAJOR) == 1 ] ; then \
			${MAKE} update_version ;\
			exit 1;\
		else \
			if [ $(ERROR_MINOR) == 1 ] ; then \
	    		echo -e "$(RED)ERROR:$(WHITE) Current Minor Version $(CURRENT_MAJOR).$(GREEN)$(CURRENT_MINOR)$(WHITE).$(CURRENT_HOTFIX) is higher than proposed version $(NEXT_MAJOR).$(RED)$(NEXT_MINOR)$(WHITE).$(NEXT_HOTFIX)" ;\
	    		exit 1;\
	  		else \
		  		if [ $(SAFE_MINOR) == 1 ] ; then \
			  		${MAKE} update_version ;\
			  	else \
			  		if [ $(ERROR_HOTFIX) == 1 ] ; then \
				    	echo -e "$(RED)ERROR:$(WHITE)  Current Hotfix Version $(CURRENT_MAJOR).$(CURRENT_MINOR).$(GREEN)$(CURRENT_HOTFIX)$(WHITE) is higher than proposed version $(NEXT_MAJOR).$(NEXT_MINOR).$(RED)$(NEXT_HOTFIX)$(WHITE)" ;\
				    	exit 1;\
				  	else \
				  		${MAKE} update_version ;\
					fi ;\
			  	fi ;\
	  		fi ;\
		fi ;\
	fi ;\


tag_and_push:
		git add --all
		git commit -a -m "Tag v $(v) $(m)"
		git tag v$(v)
		git push
		git push --tags

tag: build release

release: test check_version update_version tag_and_push	


		
remove_tag:
ifeq ($(t),)
	$(error t is undefined, you must config a tag name. e.g. make remove_tag t=v1.0.0)
endif
	@echo "Removing tag " $(t) locally and remotely
	git tag -d $(t)
	git push origin :refs/tags/$(t)