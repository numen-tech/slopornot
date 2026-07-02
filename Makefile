# Release artifact bundling.
#
# `make dist` builds both upload zips with stable, platform-consistent names
# for the publish workflow and for manual builds:
#   - claude-skills/agentic-humanizer-claude-desktop.zip  (Claude Desktop)
#   - agentic-humanizer-chatgpt.zip                       (ChatGPT Skills)
#
# The Claude Desktop zip is delegated to claude-skills/Makefile so the bundle
# copies are refreshed first. The ChatGPT zip is the canonical skill tree
# zipped as-is.

CHATGPT_ZIP := agentic-humanizer-chatgpt.zip

.PHONY: dist clean-dist

dist:
	$(MAKE) -C claude-skills zip
	rm -f $(CHATGPT_ZIP)
	cd skills && zip -r ../$(CHATGPT_ZIP) agentic-humanizer -x '*/.DS_Store'

clean-dist:
	$(MAKE) -C claude-skills clean
	rm -f $(CHATGPT_ZIP)
