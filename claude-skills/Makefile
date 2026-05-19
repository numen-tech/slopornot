CANONICAL := ../skills/agentic-humanizer
BUNDLE    := agentic-humanizer
ZIP       := agentic-humanizer-desktop.zip

.PHONY: zip build check clean

zip: build
	rm -f $(ZIP)
	zip -r $(ZIP) $(BUNDLE) -x '*.DS_Store'

build:
	rm -rf $(BUNDLE)/references $(BUNDLE)/examples
	cp -R $(CANONICAL)/references $(BUNDLE)/references
	cp -R $(CANONICAL)/examples $(BUNDLE)/examples

# Diffs the committed bundle copies against canonical. Must NOT depend on
# build: rebuilding first would overwrite the copies and mask drift.
check:
	diff -r $(CANONICAL)/references $(BUNDLE)/references
	diff -r $(CANONICAL)/examples $(BUNDLE)/examples

clean:
	rm -f $(ZIP)
