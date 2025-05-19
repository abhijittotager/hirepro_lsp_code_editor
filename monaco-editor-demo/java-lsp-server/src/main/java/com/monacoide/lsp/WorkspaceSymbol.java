package com.monacoide.lsp;

import org.eclipse.lsp4j.SymbolInformation;
import org.eclipse.lsp4j.SymbolKind;
import org.eclipse.lsp4j.SymbolTag;
import org.eclipse.lsp4j.jsonrpc.messages.Either;

import java.util.List;

/**
 * WorkspaceSymbol is a more advanced version of SymbolInformation, added in later versions of the LSP spec.
 * This is a simple implementation for compatibility with our current code.
 */
public class WorkspaceSymbol {
    private String name;
    private SymbolKind kind;
    private Either<String, org.eclipse.lsp4j.Location> location;
    private String containerName;
    private List<SymbolTag> tags;

    public WorkspaceSymbol() {
    }

    public WorkspaceSymbol(String name, SymbolKind kind, Either<String, org.eclipse.lsp4j.Location> location) {
        this.name = name;
        this.kind = kind;
        this.location = location;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public SymbolKind getKind() {
        return kind;
    }

    public void setKind(SymbolKind kind) {
        this.kind = kind;
    }

    public Either<String, org.eclipse.lsp4j.Location> getLocation() {
        return location;
    }

    public void setLocation(Either<String, org.eclipse.lsp4j.Location> location) {
        this.location = location;
    }

    public String getContainerName() {
        return containerName;
    }

    public void setContainerName(String containerName) {
        this.containerName = containerName;
    }

    public List<SymbolTag> getTags() {
        return tags;
    }

    public void setTags(List<SymbolTag> tags) {
        this.tags = tags;
    }

    /**
     * Convert from a legacy SymbolInformation to the newer WorkspaceSymbol format
     */
    public static WorkspaceSymbol fromSymbolInformation(SymbolInformation info) {
        WorkspaceSymbol symbol = new WorkspaceSymbol();
        symbol.setName(info.getName());
        symbol.setKind(info.getKind());
        symbol.setLocation(Either.forRight(info.getLocation()));
        symbol.setContainerName(info.getContainerName());
        symbol.setTags(info.getTags());
        return symbol;
    }
}
