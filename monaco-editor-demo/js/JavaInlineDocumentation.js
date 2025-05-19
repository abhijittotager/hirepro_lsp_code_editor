/**
 * JavaInlineDocumentation.js
 * Provides rich hover documentation for Java classes, methods, and keywords in Monaco Editor
 */

(function() {
    'use strict';

    // Define Java documentation database
    const javaDocumentation = {
        // Core Java language keywords
        keywords: {
            'abstract': {
                title: 'abstract',
                description: 'A class that is declared abstract may not be instantiated (i.e., you cannot create objects of that type). Abstract classes may or may not contain abstract methods.',
                example: 'abstract class Shape {\n    abstract void draw();\n}'
            },
            'assert': {
                title: 'assert',
                description: 'Used to verify assumptions about your program. When the JVM runs with assertions enabled, the statement executes and throws an AssertionError if the expression evaluates to false.',
                example: 'assert x > 0 : "x must be positive";'
            },
            'class': {
                title: 'class',
                description: 'A template that describes the kinds of state and behavior that objects of its type support.',
                example: 'public class Employee {\n    private String name;\n    \n    public void setName(String name) {\n        this.name = name;\n    }\n}'
            },
            'enum': {
                title: 'enum',
                description: 'A special data type that enables for a variable to be a set of predefined constants.',
                example: 'enum Day {\n    SUNDAY, MONDAY, TUESDAY, WEDNESDAY,\n    THURSDAY, FRIDAY, SATURDAY\n}'
            },
            'extends': {
                title: 'extends',
                description: 'Used to indicate that a class is derived from another class or interface.',
                example: 'public class Manager extends Employee {\n    // Manager-specific functionality\n}'
            },
            'final': {
                title: 'final',
                description: 'A final class cannot be subclassed. A final method cannot be overridden. A final variable can only be initialized once.',
                example: 'final int MAX_USERS = 100;\nfinal class Utility { /* ... */ }'
            },
            'implements': {
                title: 'implements',
                description: 'Used to implement an interface.',
                example: 'public class Rectangle implements Shape {\n    public void draw() {\n        // Draw a rectangle\n    }\n}'
            },
            'interface': {
                title: 'interface',
                description: 'A reference type that can contain only constants, method signatures, default methods, static methods, and nested types.',
                example: 'public interface Drawable {\n    void draw();\n}'
            },
            'new': {
                title: 'new',
                description: 'Used to create new objects.',
                example: 'Student s = new Student();'
            },
            'static': {
                title: 'static',
                description: 'Used to create class methods and variables. Static members belong to the class instead of a specific instance.',
                example: 'public static int countInstances = 0;\npublic static void main(String[] args) { /* ... */ }'
            },
            'synchronized': {
                title: 'synchronized',
                description: 'Used to indicate that a method can only be accessed by one thread at a time.',
                example: 'public synchronized void increment() {\n    count++;\n}'
            },
            'try': {
                title: 'try',
                description: 'Specifies a block of code that is tested for errors while it is being executed.',
                example: 'try {\n    // Code that may throw an exception\n} catch (IOException e) {\n    // Handle IOException\n} finally {\n    // Always executed\n}'
            },
            'var': {
                title: 'var (Java 10+)',
                description: 'Type inference for local variables. The compiler infers the type of the variable from the type of the initializer expression.',
                example: 'var list = new ArrayList<String>(); // inferred as ArrayList<String>\nvar stream = list.stream(); // inferred as Stream<String>'
            },
            'record': {
                title: 'record (Java 16+)',
                description: 'A special kind of class declaration that defines an immutable data carrier. Records automatically generate constructor, equals, hashCode, and toString methods.',
                example: 'public record Person(String name, int age) {\n    // Additional methods can be declared here\n}'
            }
        },
        
        // Java core classes
        classes: {
            'String': {
                title: 'java.lang.String',
                description: 'The String class represents character strings. All string literals in Java programs, such as "abc", are implemented as instances of this class.',
                methods: [
                    { name: 'length()', returnType: 'int', description: 'Returns the length of this string.' },
                    { name: 'charAt(int index)', returnType: 'char', description: 'Returns the char value at the specified index.' },
                    { name: 'substring(int beginIndex)', returnType: 'String', description: 'Returns a substring starting from beginIndex to the end.' },
                    { name: 'substring(int beginIndex, int endIndex)', returnType: 'String', description: 'Returns a substring from beginIndex to endIndex-1.' },
                    { name: 'equals(Object obj)', returnType: 'boolean', description: 'Compares this string to the specified object.' },
                    { name: 'equalsIgnoreCase(String str)', returnType: 'boolean', description: 'Compares this String to another String, ignoring case.' },
                    { name: 'startsWith(String prefix)', returnType: 'boolean', description: 'Tests if this string starts with the specified prefix.' },
                    { name: 'endsWith(String suffix)', returnType: 'boolean', description: 'Tests if this string ends with the specified suffix.' },
                    { name: 'indexOf(String str)', returnType: 'int', description: 'Returns the index of the first occurrence of the specified substring.' },
                    { name: 'lastIndexOf(String str)', returnType: 'int', description: 'Returns the index of the last occurrence of the specified substring.' },
                    { name: 'replace(char oldChar, char newChar)', returnType: 'String', description: 'Returns a new string with all occurrences of oldChar replaced by newChar.' },
                    { name: 'toLowerCase()', returnType: 'String', description: 'Converts all characters in this String to lowercase.' },
                    { name: 'toUpperCase()', returnType: 'String', description: 'Converts all characters in this String to uppercase.' },
                    { name: 'trim()', returnType: 'String', description: 'Returns a copy of the string with leading and trailing whitespace removed.' },
                    { name: 'split(String regex)', returnType: 'String[]', description: 'Splits this string around matches of the given regular expression.' }
                ]
            },
            'StringBuilder': {
                title: 'java.lang.StringBuilder',
                description: 'A mutable sequence of characters. Provides an API compatible with StringBuffer, but with no guarantee of synchronization.',
                methods: [
                    { name: 'append(String str)', returnType: 'StringBuilder', description: 'Appends the specified string to this character sequence.' },
                    { name: 'insert(int offset, String str)', returnType: 'StringBuilder', description: 'Inserts the specified string at the specified position.' },
                    { name: 'delete(int start, int end)', returnType: 'StringBuilder', description: 'Removes the characters in a substring of this sequence.' },
                    { name: 'reverse()', returnType: 'StringBuilder', description: 'Causes this character sequence to be replaced by the reverse of the sequence.' },
                    { name: 'toString()', returnType: 'String', description: 'Returns a string representing the data in this sequence.' }
                ]
            },
            'ArrayList': {
                title: 'java.util.ArrayList',
                description: 'Resizable-array implementation of the List interface. Implements all optional list operations, and permits all elements, including null.',
                methods: [
                    { name: 'add(E element)', returnType: 'boolean', description: 'Appends the specified element to the end of this list.' },
                    { name: 'add(int index, E element)', returnType: 'void', description: 'Inserts the specified element at the specified position in this list.' },
                    { name: 'remove(int index)', returnType: 'E', description: 'Removes the element at the specified position in this list.' },
                    { name: 'get(int index)', returnType: 'E', description: 'Returns the element at the specified position in this list.' },
                    { name: 'set(int index, E element)', returnType: 'E', description: 'Replaces the element at the specified position in this list with the specified element.' },
                    { name: 'size()', returnType: 'int', description: 'Returns the number of elements in this list.' },
                    { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if this list contains no elements.' },
                    { name: 'contains(Object o)', returnType: 'boolean', description: 'Returns true if this list contains the specified element.' },
                    { name: 'clear()', returnType: 'void', description: 'Removes all of the elements from this list.' }
                ]
            },
            'HashMap': {
                title: 'java.util.HashMap',
                description: 'Hash table based implementation of the Map interface. This implementation provides all of the optional map operations.',
                methods: [
                    { name: 'put(K key, V value)', returnType: 'V', description: 'Associates the specified value with the specified key in this map.' },
                    { name: 'get(Object key)', returnType: 'V', description: 'Returns the value to which the specified key is mapped, or null if this map contains no mapping for the key.' },
                    { name: 'remove(Object key)', returnType: 'V', description: 'Removes the mapping for the specified key from this map if present.' },
                    { name: 'containsKey(Object key)', returnType: 'boolean', description: 'Returns true if this map contains a mapping for the specified key.' },
                    { name: 'containsValue(Object value)', returnType: 'boolean', description: 'Returns true if this map maps one or more keys to the specified value.' },
                    { name: 'size()', returnType: 'int', description: 'Returns the number of key-value mappings in this map.' },
                    { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if this map contains no key-value mappings.' },
                    { name: 'clear()', returnType: 'void', description: 'Removes all of the mappings from this map.' },
                    { name: 'keySet()', returnType: 'Set<K>', description: 'Returns a Set view of the keys contained in this map.' },
                    { name: 'values()', returnType: 'Collection<V>', description: 'Returns a Collection view of the values contained in this map.' }
                ]
            },
            'System': {
                title: 'java.lang.System',
                description: 'The System class contains several useful class fields and methods. It cannot be instantiated.',
                fields: [
                    { name: 'out', type: 'PrintStream', description: 'The "standard" output stream, typically console output.' },
                    { name: 'err', type: 'PrintStream', description: 'The "standard" error output stream, typically console error output.' },
                    { name: 'in', type: 'InputStream', description: 'The "standard" input stream, typically console input.' }
                ],
                methods: [
                    { name: 'currentTimeMillis()', returnType: 'long', description: 'Returns the current time in milliseconds since January 1, 1970 UTC.' },
                    { name: 'arraycopy(Object src, int srcPos, Object dest, int destPos, int length)', returnType: 'void', description: 'Copies an array from the specified source array to the specified destination array.' },
                    { name: 'exit(int status)', returnType: 'void', description: 'Terminates the currently running Java Virtual Machine.' },
                    { name: 'gc()', returnType: 'void', description: 'Runs the garbage collector.' },
                    { name: 'getProperty(String key)', returnType: 'String', description: 'Gets the system property indicated by the specified key.' }
                ]
            },
            'Math': {
                title: 'java.lang.Math',
                description: 'The Math class contains methods for performing basic numeric operations such as the elementary exponential, logarithm, square root, and trigonometric functions.',
                fields: [
                    { name: 'PI', type: 'double', description: 'The double value that is closer than any other to pi, the ratio of the circumference of a circle to its diameter.' },
                    { name: 'E', type: 'double', description: 'The double value that is closer than any other to e, the base of the natural logarithms.' }
                ],
                methods: [
                    { name: 'abs(int a)', returnType: 'int', description: 'Returns the absolute value of an int value.' },
                    { name: 'max(int a, int b)', returnType: 'int', description: 'Returns the greater of two int values.' },
                    { name: 'min(int a, int b)', returnType: 'int', description: 'Returns the smaller of two int values.' },
                    { name: 'pow(double a, double b)', returnType: 'double', description: 'Returns the value of the first argument raised to the power of the second argument.' },
                    { name: 'sqrt(double a)', returnType: 'double', description: 'Returns the correctly rounded positive square root of a double value.' },
                    { name: 'random()', returnType: 'double', description: 'Returns a double value with a positive sign, greater than or equal to 0.0 and less than 1.0.' },
                    { name: 'round(float a)', returnType: 'int', description: 'Returns the closest int to the argument, with ties rounding to positive infinity.' },
                    { name: 'floor(double a)', returnType: 'double', description: 'Returns the largest (closest to positive infinity) double value that is less than or equal to the argument and is equal to a mathematical integer.' },
                    { name: 'ceil(double a)', returnType: 'double', description: 'Returns the smallest (closest to negative infinity) double value that is greater than or equal to the argument and is equal to a mathematical integer.' }
                ]
            },
            'Object': {
                title: 'java.lang.Object',
                description: 'Class Object is the root of the class hierarchy. Every class has Object as a superclass. All objects, including arrays, implement the methods of this class.',
                methods: [
                    { name: 'equals(Object obj)', returnType: 'boolean', description: 'Indicates whether some other object is "equal to" this one.' },
                    { name: 'hashCode()', returnType: 'int', description: 'Returns a hash code value for the object.' },
                    { name: 'toString()', returnType: 'String', description: 'Returns a string representation of the object.' },
                    { name: 'getClass()', returnType: 'Class<?>', description: 'Returns the runtime class of this Object.' },
                    { name: 'clone()', returnType: 'Object', description: 'Creates and returns a copy of this object.' },
                    { name: 'finalize()', returnType: 'void', description: 'Called by the garbage collector on an object when garbage collection determines that there are no more references to the object.' },
                    { name: 'notify()', returnType: 'void', description: 'Wakes up a single thread that is waiting on this object\'s monitor.' },
                    { name: 'notifyAll()', returnType: 'void', description: 'Wakes up all threads that are waiting on this object\'s monitor.' },
                    { name: 'wait()', returnType: 'void', description: 'Causes the current thread to wait until another thread invokes the notify() method or the notifyAll() method for this object.' }
                ]
            },
            'Collections': {
                title: 'java.util.Collections',
                description: 'This class consists exclusively of static methods that operate on or return collections. It contains polymorphic algorithms that operate on collections, "wrappers", and empty immutable instances.',
                methods: [
                    { name: 'sort(List<T> list)', returnType: 'void', description: 'Sorts the specified list into ascending order, according to the natural ordering of its elements.' },
                    { name: 'reverse(List<?> list)', returnType: 'void', description: 'Reverses the order of the elements in the specified list.' },
                    { name: 'shuffle(List<?> list)', returnType: 'void', description: 'Randomly permutes the specified list using a default source of randomness.' },
                    { name: 'max(Collection<?> coll)', returnType: 'T', description: 'Returns the maximum element of the given collection, according to the natural ordering of its elements.' },
                    { name: 'min(Collection<?> coll)', returnType: 'T', description: 'Returns the minimum element of the given collection, according to the natural ordering of its elements.' },
                    { name: 'binarySearch(List<? extends Comparable<? super T>> list, T key)', returnType: 'int', description: 'Searches the specified list for the specified object using the binary search algorithm.' },
                    { name: 'frequency(Collection<?> c, Object o)', returnType: 'int', description: 'Returns the number of elements in the specified collection equal to the specified object.' },
                    { name: 'emptyList()', returnType: 'List<T>', description: 'Returns an empty list (immutable).' },
                    { name: 'emptyMap()', returnType: 'Map<K,V>', description: 'Returns an empty map (immutable).' },
                    { name: 'emptySet()', returnType: 'Set<T>', description: 'Returns an empty set (immutable).' }
                ]
            },
            'Thread': {
                title: 'java.lang.Thread',
                description: 'A thread is a thread of execution in a program. The Java Virtual Machine allows an application to have multiple threads of execution running concurrently.',
                methods: [
                    { name: 'start()', returnType: 'void', description: 'Causes this thread to begin execution; the Java Virtual Machine calls the run method of this thread.' },
                    { name: 'run()', returnType: 'void', description: 'If this thread was constructed using a separate Runnable run object, then that Runnable object\'s run method is called; otherwise, this method does nothing and returns.' },
                    { name: 'sleep(long millis)', returnType: 'void', description: 'Causes the currently executing thread to sleep (temporarily cease execution) for the specified number of milliseconds.' },
                    { name: 'join()', returnType: 'void', description: 'Waits for this thread to die.' },
                    { name: 'interrupt()', returnType: 'void', description: 'Interrupts this thread.' },
                    { name: 'isAlive()', returnType: 'boolean', description: 'Tests if this thread is alive.' },
                    { name: 'currentThread()', returnType: 'Thread', description: 'Returns a reference to the currently executing thread object.' }
                ]
            },
            'Optional': {
                title: 'java.util.Optional<T>',
                description: 'A container object which may or may not contain a non-null value. If a value is present, isPresent() returns true. If no value is present, the object is considered empty and isPresent() returns false.',
                methods: [
                    { name: 'of(T value)', returnType: 'Optional<T>', description: 'Returns an Optional describing the given non-null value.' },
                    { name: 'ofNullable(T value)', returnType: 'Optional<T>', description: 'Returns an Optional describing the given value, if non-null, otherwise returns an empty Optional.' },
                    { name: 'empty()', returnType: 'Optional<T>', description: 'Returns an empty Optional instance.' },
                    { name: 'isPresent()', returnType: 'boolean', description: 'Returns true if a value is present, otherwise false.' },
                    { name: 'get()', returnType: 'T', description: 'If a value is present, returns the value, otherwise throws NoSuchElementException.' },
                    { name: 'orElse(T other)', returnType: 'T', description: 'Returns the value if present, otherwise returns other.' },
                    { name: 'orElseGet(Supplier<? extends T> supplier)', returnType: 'T', description: 'Returns the value if present, otherwise invokes supplier and returns the result of that invocation.' },
                    { name: 'orElseThrow(Supplier<? extends X> exceptionSupplier)', returnType: 'T', description: 'Returns the contained value, if present, otherwise throws an exception to be created by the provided supplier.' },
                    { name: 'ifPresent(Consumer<? super T> action)', returnType: 'void', description: 'If a value is present, performs the given action with the value, otherwise does nothing.' },
                    { name: 'map(Function<? super T,? extends U> mapper)', returnType: 'Optional<U>', description: 'If a value is present, returns an Optional describing (as if by ofNullable) the result of applying the given mapping function to the value, otherwise returns an empty Optional.' },
                    { name: 'flatMap(Function<? super T,? extends Optional<? extends U>> mapper)', returnType: 'Optional<U>', description: 'If a value is present, returns the result of applying the given Optional-bearing mapping function to the value, otherwise returns an empty Optional.' }
                ]
            }
        }
    };

    // Format method documentation for hover
    function formatMethodDocs(method) {
        return `**${method.name}** : ${method.returnType}\n\n${method.description}`;
    }

    // Format field documentation for hover
    function formatFieldDocs(field) {
        return `**${field.name}** : ${field.type}\n\n${field.description}`;
    }

    // Format class documentation for hover
    function formatClassDocs(classDoc) {
        let result = `# ${classDoc.title}\n\n${classDoc.description}\n\n`;
        
        if (classDoc.fields) {
            result += '## Fields\n\n';
            classDoc.fields.forEach(field => {
                result += `* **${field.name}** : ${field.type}\n`;
            });
            result += '\n';
        }
        
        if (classDoc.methods) {
            result += '## Methods\n\n';
            classDoc.methods.forEach(method => {
                result += `* **${method.name}** : ${method.returnType}\n`;
            });
        }
        
        return result;
    }

    // Format keyword documentation for hover
    function formatKeywordDocs(keywordDoc) {
        return `# ${keywordDoc.title}\n\n${keywordDoc.description}\n\n\`\`\`java\n${keywordDoc.example}\n\`\`\``;
    }

    // Register Java documentation hover provider
    function registerJavaInlineDocumentation(monaco) {
        monaco.languages.registerHoverProvider('java', {
            provideHover: function(model, position) {
                const wordInfo = model.getWordAtPosition(position);
                if (!wordInfo) return null;
                
                const word = wordInfo.word;
                
                // Check for keywords
                if (javaDocumentation.keywords[word]) {
                    return {
                        contents: [
                            { value: formatKeywordDocs(javaDocumentation.keywords[word]) }
                        ],
                        range: new monaco.Range(
                            position.lineNumber,
                            wordInfo.startColumn,
                            position.lineNumber,
                            wordInfo.endColumn
                        )
                    };
                }
                
                // Check for classes
                if (javaDocumentation.classes[word]) {
                    return {
                        contents: [
                            { value: formatClassDocs(javaDocumentation.classes[word]) }
                        ],
                        range: new monaco.Range(
                            position.lineNumber,
                            wordInfo.startColumn,
                            position.lineNumber,
                            wordInfo.endColumn
                        )
                    };
                }
                
                // Check for methods - this requires more context analysis
                // Get the line content and check for method calls
                const lineContent = model.getLineContent(position.lineNumber);
                const methodRegex = /(\w+)\.(\w+)\(/g;
                let match;
                
                while ((match = methodRegex.exec(lineContent)) !== null) {
                    const className = match[1];
                    const methodName = match[2];
                    const methodStart = match.index + className.length + 1; // +1 for the dot
                    const methodEnd = methodStart + methodName.length;
                    
                    // Check if the cursor is positioned on this method
                    if (position.column >= methodStart && position.column <= methodEnd) {
                        if (javaDocumentation.classes[className]) {
                            // Find the method in the class
                            const classDoc = javaDocumentation.classes[className];
                            if (classDoc.methods) {
                                for (const method of classDoc.methods) {
                                    // Extract just the method name without parameters
                                    const nameOnly = method.name.split('(')[0];
                                    if (nameOnly === methodName) {
                                        return {
                                            contents: [
                                                { value: formatMethodDocs(method) }
                                            ],
                                            range: new monaco.Range(
                                                position.lineNumber,
                                                methodStart,
                                                position.lineNumber,
                                                methodEnd
                                            )
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
                
                return null;
            }
        });

        console.log('Java inline documentation registered!');
    }

    // Make function available globally
    window.registerJavaInlineDocumentation = registerJavaInlineDocumentation;
})();
