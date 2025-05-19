/**
 * Sample Java file for testing VS Code JDT.LS integration
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Monaco Editor with JDT.LS!");
        
        // Test string methods (for autocomplete testing)
        String message = "Test";
        message.length();
        
        // Create an instance of TestClass (for testing code navigation)
        TestClass test = new TestClass();
        test.doSomething();
    }
}

/**
 * A simple test class
 */
class TestClass {
    private int value;
    
    public TestClass() {
        this.value = 100;
    }
    
    /**
     * Does something important
     * @return The result value
     */
    public int doSomething() {
        return value * 2;
    }
}
