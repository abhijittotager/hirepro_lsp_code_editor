/**
 * JavaTypeSystem.js
 * 
 * Comprehensive database of Java types, methods, and fields for IntelliSense
 * Organizes types by package with complete method signatures
 */

// Root object for the Java type system
const JavaTypeSystem = {
    // Base common types
    baseTypes: {
        'Object': {
            methods: [
                { name: 'toString()', returnType: 'String', description: 'Returns a string representation of the object' },
                { name: 'equals(Object obj)', returnType: 'boolean', description: 'Indicates whether some other object is equal to this one' },
                { name: 'hashCode()', returnType: 'int', description: 'Returns a hash code value for the object' },
                { name: 'getClass()', returnType: 'Class<?>',  description: 'Returns the runtime class of this Object' },
                { name: 'clone()', returnType: 'Object', description: 'Creates and returns a copy of this object' },
                { name: 'notify()', returnType: 'void', description: 'Wakes up a single thread that is waiting on this object\'s monitor' },
                { name: 'notifyAll()', returnType: 'void', description: 'Wakes up all threads that are waiting on this object\'s monitor' },
                { name: 'wait()', returnType: 'void', description: 'Causes the current thread to wait until it is awakened' },
                { name: 'wait(long timeout)', returnType: 'void', description: 'Causes the current thread to wait until it is awakened or a timeout occurs' },
                { name: 'finalize()', returnType: 'void', description: 'Called by the garbage collector on an object when garbage collection determines that there are no more references to the object' }
            ]
        }
    },
    
    // Java language package
    java: {
        lang: {
            'String': {
                inherits: 'Object',
                methods: [
                    { name: 'length()', returnType: 'int', description: 'Returns the length of this string' },
                    { name: 'charAt(int index)', returnType: 'char', description: 'Returns the character at the specified index' },
                    { name: 'substring(int beginIndex)', returnType: 'String', description: 'Returns a substring starting at the specified index' },
                    { name: 'substring(int beginIndex, int endIndex)', returnType: 'String', description: 'Returns a substring between the specified indices' },
                    { name: 'indexOf(String str)', returnType: 'int', description: 'Returns the index of the first occurrence of the specified substring' },
                    { name: 'indexOf(String str, int fromIndex)', returnType: 'int', description: 'Returns the index of the first occurrence of the specified substring, starting at the specified index' },
                    { name: 'lastIndexOf(String str)', returnType: 'int', description: 'Returns the index of the last occurrence of the specified substring' },
                    { name: 'replace(char oldChar, char newChar)', returnType: 'String', description: 'Returns a new string resulting from replacing all occurrences of oldChar with newChar' },
                    { name: 'toLowerCase()', returnType: 'String', description: 'Converts all characters to lower case' },
                    { name: 'toUpperCase()', returnType: 'String', description: 'Converts all characters to upper case' },
                    { name: 'trim()', returnType: 'String', description: 'Removes leading and trailing whitespace' },
                    { name: 'split(String regex)', returnType: 'String[]', description: 'Splits this string around matches of the given regular expression' },
                    { name: 'concat(String str)', returnType: 'String', description: 'Concatenates the specified string to the end of this string' },
                    { name: 'matches(String regex)', returnType: 'boolean', description: 'Tells whether or not this string matches the given regular expression' },
                    { name: 'contains(CharSequence s)', returnType: 'boolean', description: 'Returns true if and only if this string contains the specified sequence of char values' },
                    { name: 'replaceAll(String regex, String replacement)', returnType: 'String', description: 'Replaces each substring of this string that matches the given regular expression with the given replacement' },
                    { name: 'replaceFirst(String regex, String replacement)', returnType: 'String', description: 'Replaces the first substring of this string that matches the given regular expression with the given replacement' },
                    { name: 'startsWith(String prefix)', returnType: 'boolean', description: 'Tests if this string starts with the specified prefix' },
                    { name: 'endsWith(String suffix)', returnType: 'boolean', description: 'Tests if this string ends with the specified suffix' },
                    { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if, and only if, length() is 0' },
                    { name: 'toCharArray()', returnType: 'char[]', description: 'Converts this string to a new character array' }
                ],
                fields: []
            },
            'System': {
                static: true,
                fields: [
                    { name: 'out', type: 'java.io.PrintStream', description: 'The standard output stream' },
                    { name: 'err', type: 'java.io.PrintStream', description: 'The standard error output stream' },
                    { name: 'in', type: 'java.io.InputStream', description: 'The standard input stream' }
                ],
                methods: [
                    { name: 'currentTimeMillis()', returnType: 'long', description: 'Returns the current time in milliseconds' },
                    { name: 'nanoTime()', returnType: 'long', description: 'Returns the current time in nanoseconds' },
                    { name: 'exit(int status)', returnType: 'void', description: 'Terminates the currently running Java virtual machine' },
                    { name: 'getProperty(String key)', returnType: 'String', description: 'Gets the system property indicated by the specified key' },
                    { name: 'getProperties()', returnType: 'java.util.Properties', description: 'Determines the current system properties' },
                    { name: 'arraycopy(Object src, int srcPos, Object dest, int destPos, int length)', returnType: 'void', description: 'Copies an array from the specified source array, beginning at the specified position, to the specified position of the destination array' },
                    { name: 'gc()', returnType: 'void', description: 'Runs the garbage collector' },
                    { name: 'getenv()', returnType: 'java.util.Map<String,String>', description: 'Returns an unmodifiable string map view of the current system environment' },
                    { name: 'getenv(String name)', returnType: 'String', description: 'Gets the value of the specified environment variable' },
                    { name: 'identityHashCode(Object x)', returnType: 'int', description: 'Returns the same hash code for the given object as would be returned by the default method hashCode()' }
                ]
            },
            'Math': {
                static: true,
                fields: [
                    { name: 'PI', type: 'double', description: 'The double value that is closer than any other to pi, the ratio of the circumference of a circle to its diameter' },
                    { name: 'E', type: 'double', description: 'The double value that is closer than any other to e, the base of the natural logarithms' }
                ],
                methods: [
                    { name: 'abs(int a)', returnType: 'int', description: 'Returns the absolute value of an int value' },
                    { name: 'abs(double a)', returnType: 'double', description: 'Returns the absolute value of a double value' },
                    { name: 'max(int a, int b)', returnType: 'int', description: 'Returns the greater of two int values' },
                    { name: 'min(int a, int b)', returnType: 'int', description: 'Returns the lesser of two int values' },
                    { name: 'sqrt(double a)', returnType: 'double', description: 'Returns the square root of a double value' },
                    { name: 'pow(double a, double b)', returnType: 'double', description: 'Returns the value of the first argument raised to the power of the second argument' },
                    { name: 'random()', returnType: 'double', description: 'Returns a double value with a positive sign, greater than or equal to 0.0 and less than 1.0' },
                    { name: 'sin(double a)', returnType: 'double', description: 'Returns the trigonometric sine of an angle' },
                    { name: 'cos(double a)', returnType: 'double', description: 'Returns the trigonometric cosine of an angle' },
                    { name: 'tan(double a)', returnType: 'double', description: 'Returns the trigonometric tangent of an angle' },
                    { name: 'log(double a)', returnType: 'double', description: 'Returns the natural logarithm (base e) of a double value' },
                    { name: 'floor(double a)', returnType: 'double', description: 'Returns the largest (closest to positive infinity) double value that is less than or equal to the argument and is equal to a mathematical integer' },
                    { name: 'ceil(double a)', returnType: 'double', description: 'Returns the smallest (closest to negative infinity) double value that is greater than or equal to the argument and is equal to a mathematical integer' },
                    { name: 'round(float a)', returnType: 'int', description: 'Returns the closest int to the argument, with ties rounding to positive infinity' },
                    { name: 'round(double a)', returnType: 'long', description: 'Returns the closest long to the argument, with ties rounding to positive infinity' }
                ]
            },
            'Integer': {
                inherits: 'Object',
                static: true,
                fields: [
                    { name: 'MAX_VALUE', type: 'int', description: 'A constant holding the maximum value an int can have, 2^31-1' },
                    { name: 'MIN_VALUE', type: 'int', description: 'A constant holding the minimum value an int can have, -2^31' }
                ],
                methods: [
                    { name: 'parseInt(String s)', returnType: 'int', description: 'Parses the string argument as a signed decimal integer' },
                    { name: 'parseInt(String s, int radix)', returnType: 'int', description: 'Parses the string argument as a signed integer in the radix specified by the second argument' },
                    { name: 'valueOf(int i)', returnType: 'Integer', description: 'Returns an Integer instance representing the specified int value' },
                    { name: 'valueOf(String s)', returnType: 'Integer', description: 'Returns an Integer object holding the value of the specified String' },
                    { name: 'toString(int i)', returnType: 'String', description: 'Returns a String object representing the specified integer' },
                    { name: 'toBinaryString(int i)', returnType: 'String', description: 'Returns a string representation of the integer argument as an unsigned integer in base 2' },
                    { name: 'toHexString(int i)', returnType: 'String', description: 'Returns a string representation of the integer argument as an unsigned integer in base 16' },
                    { name: 'toOctalString(int i)', returnType: 'String', description: 'Returns a string representation of the integer argument as an unsigned integer in base 8' }
                ]
            },
            'Boolean': {
                inherits: 'Object',
                static: true,
                fields: [
                    { name: 'TRUE', type: 'Boolean', description: 'The Boolean object corresponding to the primitive value true' },
                    { name: 'FALSE', type: 'Boolean', description: 'The Boolean object corresponding to the primitive value false' }
                ],
                methods: [
                    { name: 'valueOf(boolean b)', returnType: 'Boolean', description: 'Returns a Boolean instance representing the specified boolean value' },
                    { name: 'valueOf(String s)', returnType: 'Boolean', description: 'Returns a Boolean with a value represented by the specified String' },
                    { name: 'parseBoolean(String s)', returnType: 'boolean', description: 'Parses the string argument as a boolean value' },
                    { name: 'toString(boolean b)', returnType: 'String', description: 'Returns a String object representing the specified boolean' }
                ]
            },
            'Thread': {
                inherits: 'Object',
                methods: [
                    { name: 'start()', returnType: 'void', description: 'Causes this thread to begin execution; the Java Virtual Machine calls the run method of this thread' },
                    { name: 'run()', returnType: 'void', description: 'If this thread was constructed using a separate Runnable run object, then that Runnable object\'s run method is called; otherwise, this method does nothing and returns' },
                    { name: 'sleep(long millis)', returnType: 'void', description: 'Causes the currently executing thread to sleep (temporarily cease execution) for the specified number of milliseconds, subject to the precision and accuracy of system timers and schedulers' },
                    { name: 'join()', returnType: 'void', description: 'Waits for this thread to die' },
                    { name: 'isAlive()', returnType: 'boolean', description: 'Tests if this thread is alive' },
                    { name: 'interrupt()', returnType: 'void', description: 'Interrupts this thread' },
                    { name: 'isInterrupted()', returnType: 'boolean', description: 'Tests whether this thread has been interrupted' }
                ],
                static: true,
                staticMethods: [
                    { name: 'currentThread()', returnType: 'Thread', description: 'Returns a reference to the currently executing thread object' },
                    { name: 'yield()', returnType: 'void', description: 'Causes the currently executing thread object to temporarily pause and allow other threads to execute' },
                    { name: 'sleep(long millis)', returnType: 'void', description: 'Causes the currently executing thread to sleep for the specified number of milliseconds' }
                ]
            }
        },
        
        io: {
            'PrintStream': {
                inherits: 'Object',
                methods: [
                    { name: 'print(String s)', returnType: 'void', description: 'Prints a string' },
                    { name: 'println()', returnType: 'void', description: 'Terminates the current line by writing the line separator string' },
                    { name: 'println(String x)', returnType: 'void', description: 'Prints a String and then terminates the line' },
                    { name: 'println(int x)', returnType: 'void', description: 'Prints an integer and then terminates the line' },
                    { name: 'println(boolean x)', returnType: 'void', description: 'Prints a boolean and then terminates the line' },
                    { name: 'println(Object x)', returnType: 'void', description: 'Prints an Object and then terminates the line' },
                    { name: 'println(double x)', returnType: 'void', description: 'Prints a double and then terminates the line' },
                    { name: 'println(char x)', returnType: 'void', description: 'Prints a character and then terminates the line' },
                    { name: 'println(char[] x)', returnType: 'void', description: 'Prints an array of characters and then terminates the line' },
                    { name: 'println(float x)', returnType: 'void', description: 'Prints a float and then terminates the line' },
                    { name: 'println(long x)', returnType: 'void', description: 'Prints a long and then terminates the line' },
                    { name: 'printf(String format, Object... args)', returnType: 'PrintStream', description: 'A convenience method to write a formatted string to this output stream using the specified format string and arguments' },
                    { name: 'format(String format, Object... args)', returnType: 'PrintStream', description: 'Writes a formatted string to this output stream using the specified format string and arguments' },
                    { name: 'append(CharSequence csq)', returnType: 'PrintStream', description: 'Appends the specified character sequence to this output stream' },
                    { name: 'checkError()', returnType: 'boolean', description: 'Flushes the stream and checks its error state' },
                    { name: 'close()', returnType: 'void', description: 'Closes this output stream and releases any system resources associated with it' },
                    { name: 'flush()', returnType: 'void', description: 'Flushes this output stream and forces any buffered output bytes to be written out' }
                ]
            },
            'File': {
                inherits: 'Object',
                methods: [
                    { name: 'exists()', returnType: 'boolean', description: 'Tests whether the file or directory denoted by this abstract pathname exists' },
                    { name: 'getName()', returnType: 'String', description: 'Returns the name of the file or directory denoted by this abstract pathname' },
                    { name: 'getPath()', returnType: 'String', description: 'Converts this abstract pathname into a pathname string' },
                    { name: 'isDirectory()', returnType: 'boolean', description: 'Tests whether the file denoted by this abstract pathname is a directory' },
                    { name: 'isFile()', returnType: 'boolean', description: 'Tests whether the file denoted by this abstract pathname is a normal file' },
                    { name: 'length()', returnType: 'long', description: 'Returns the length of the file denoted by this abstract pathname' },
                    { name: 'createNewFile()', returnType: 'boolean', description: 'Atomically creates a new, empty file named by this abstract pathname' },
                    { name: 'delete()', returnType: 'boolean', description: 'Deletes the file or directory denoted by this abstract pathname' },
                    { name: 'list()', returnType: 'String[]', description: 'Returns an array of strings naming the files and directories in the directory' },
                    { name: 'mkdir()', returnType: 'boolean', description: 'Creates the directory named by this abstract pathname' },
                    { name: 'getAbsolutePath()', returnType: 'String', description: 'Returns the absolute pathname string of this abstract pathname' },
                    { name: 'getParent()', returnType: 'String', description: 'Returns the pathname string of this abstract pathname\'s parent, or null if this pathname does not name a parent directory' },
                    { name: 'canRead()', returnType: 'boolean', description: 'Tests whether the application can read the file denoted by this abstract pathname' },
                    { name: 'canWrite()', returnType: 'boolean', description: 'Tests whether the application can modify the file denoted by this abstract pathname' },
                    { name: 'lastModified()', returnType: 'long', description: 'Returns the time that the file denoted by this abstract pathname was last modified' }
                ],
                static: true,
                staticMethods: [
                    { name: 'createTempFile(String prefix, String suffix)', returnType: 'File', description: 'Creates an empty file in the default temporary-file directory, using the given prefix and suffix to generate its name' },
                    { name: 'listRoots()', returnType: 'File[]', description: 'List the available filesystem roots' }
                ]
            }
        },
        
        util: {
            'ArrayList<E>': {
                inherits: 'Object',
                genericType: true,
                methods: [
                    { name: 'add(E e)', returnType: 'boolean', description: 'Appends the specified element to the end of this list' },
                    { name: 'add(int index, E element)', returnType: 'void', description: 'Inserts the specified element at the specified position in this list' },
                    { name: 'get(int index)', returnType: 'E', description: 'Returns the element at the specified position in this list' },
                    { name: 'remove(int index)', returnType: 'E', description: 'Removes the element at the specified position in this list' },
                    { name: 'remove(Object o)', returnType: 'boolean', description: 'Removes the first occurrence of the specified element from this list, if it is present' },
                    { name: 'size()', returnType: 'int', description: 'Returns the number of elements in this list' },
                    { name: 'clear()', returnType: 'void', description: 'Removes all of the elements from this list' },
                    { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if this list contains no elements' },
                    { name: 'contains(Object o)', returnType: 'boolean', description: 'Returns true if this list contains the specified element' },
                    { name: 'indexOf(Object o)', returnType: 'int', description: 'Returns the index of the first occurrence of the specified element in this list' },
                    { name: 'lastIndexOf(Object o)', returnType: 'int', description: 'Returns the index of the last occurrence of the specified element in this list' },
                    { name: 'toArray()', returnType: 'Object[]', description: 'Returns an array containing all of the elements in this list in proper sequence' },
                    { name: 'iterator()', returnType: 'Iterator<E>', description: 'Returns an iterator over the elements in this list in proper sequence' },
                    { name: 'addAll(Collection<? extends E> c)', returnType: 'boolean', description: 'Appends all of the elements in the specified collection to the end of this list' },
                    { name: 'addAll(int index, Collection<? extends E> c)', returnType: 'boolean', description: 'Inserts all of the elements in the specified collection into this list at the specified position' },
                    { name: 'removeAll(Collection<?> c)', returnType: 'boolean', description: 'Removes from this list all of its elements that are contained in the specified collection' },
                    { name: 'retainAll(Collection<?> c)', returnType: 'boolean', description: 'Retains only the elements in this list that are contained in the specified collection' },
                    { name: 'subList(int fromIndex, int toIndex)', returnType: 'List<E>', description: 'Returns a view of the portion of this list between the specified fromIndex, inclusive, and toIndex, exclusive' }
                ]
            },
            'HashMap<K,V>': {
                inherits: 'Object',
                genericType: true,
                methods: [
                    { name: 'put(K key, V value)', returnType: 'V', description: 'Associates the specified value with the specified key in this map' },
                    { name: 'get(Object key)', returnType: 'V', description: 'Returns the value to which the specified key is mapped, or null if this map contains no mapping for the key' },
                    { name: 'remove(Object key)', returnType: 'V', description: 'Removes the mapping for a key from this map if it is present' },
                    { name: 'containsKey(Object key)', returnType: 'boolean', description: 'Returns true if this map contains a mapping for the specified key' },
                    { name: 'containsValue(Object value)', returnType: 'boolean', description: 'Returns true if this map maps one or more keys to the specified value' },
                    { name: 'size()', returnType: 'int', description: 'Returns the number of key-value mappings in this map' },
                    { name: 'isEmpty()', returnType: 'boolean', description: 'Returns true if this map contains no key-value mappings' },
                    { name: 'clear()', returnType: 'void', description: 'Removes all of the mappings from this map' },
                    { name: 'keySet()', returnType: 'Set<K>', description: 'Returns a Set view of the keys contained in this map' },
                    { name: 'values()', returnType: 'Collection<V>', description: 'Returns a Collection view of the values contained in this map' },
                    { name: 'entrySet()', returnType: 'Set<Map.Entry<K,V>>', description: 'Returns a Set view of the mappings contained in this map' },
                    { name: 'putAll(Map<? extends K,? extends V> m)', returnType: 'void', description: 'Copies all of the mappings from the specified map to this map' }
                ]
            },
            'Date': {
                inherits: 'Object',
                methods: [
                    { name: 'getTime()', returnType: 'long', description: 'Returns the number of milliseconds since January 1, 1970, 00:00:00 GMT represented by this Date object' },
                    { name: 'setTime(long time)', returnType: 'void', description: 'Sets this Date object to represent the specified number of milliseconds since January 1, 1970, 00:00:00 GMT' },
                    { name: 'before(Date when)', returnType: 'boolean', description: 'Tests if this date is before the specified date' },
                    { name: 'after(Date when)', returnType: 'boolean', description: 'Tests if this date is after the specified date' },
                    { name: 'equals(Object obj)', returnType: 'boolean', description: 'Compares two dates for equality' },
                    { name: 'compareTo(Date anotherDate)', returnType: 'int', description: 'Compares two Dates for ordering' },
                    { name: 'toString()', returnType: 'String', description: 'Converts this Date object to a String of the form: dow mon dd hh:mm:ss zzz yyyy' }
                ]
            }
        }
    },
    
    // Java package structure for package completions - comprehensive list of all standard Java packages
    packageHierarchy: [
        // Core Java Packages
        { name: 'java', description: 'Root Java package' },
        { name: 'java.lang', description: 'Fundamental classes of the Java language' },
        { name: 'java.lang.annotation', description: 'Types used to annotate packages, types, constructors, methods, fields, parameters, and variables' },
        { name: 'java.lang.instrument', description: 'Provides services that allow Java programming language agents to instrument programs running on the JVM' },
        { name: 'java.lang.invoke', description: 'Contains dynamic language support provided directly by the Java core class libraries and VM' },
        { name: 'java.lang.management', description: 'Management interfaces for monitoring and management of the JVM' },
        { name: 'java.lang.module', description: 'Classes to support module descriptors and creating configurations of modules' },
        { name: 'java.lang.ref', description: 'Reference-object classes, which support a limited degree of interaction with the garbage collector' },
        { name: 'java.lang.reflect', description: 'Classes and interfaces for obtaining reflective information about classes and objects' },
        
        // Utility Packages
        { name: 'java.util', description: 'Collections framework, event model, date/time facilities, and miscellaneous utilities' },
        { name: 'java.util.concurrent', description: 'Utility classes for concurrent programming' },
        { name: 'java.util.concurrent.atomic', description: 'Small toolkit of classes that support lock-free thread-safe programming on single variables' },
        { name: 'java.util.concurrent.locks', description: 'Interfaces and classes providing a framework for locking and waiting for conditions' },
        { name: 'java.util.function', description: 'Functional interfaces for lambda expressions' },
        { name: 'java.util.jar', description: 'Classes for reading and writing JAR files' },
        { name: 'java.util.logging', description: 'Facilities for application logging' },
        { name: 'java.util.prefs', description: 'Classes for storing and retrieving user and system preference settings' },
        { name: 'java.util.random', description: 'Classes for random number generation' },
        { name: 'java.util.regex', description: 'Classes for matching character sequences against regular expressions' },
        { name: 'java.util.spi', description: 'Service provider interfaces for the classes in the java.util package' },
        { name: 'java.util.stream', description: 'Classes for functional-style operations on streams of elements' },
        { name: 'java.util.zip', description: 'Classes for reading and writing the standard ZIP and GZIP file formats' },
        
        // I/O and NIO Packages
        { name: 'java.io', description: 'System input and output through data streams, serialization and the file system' },
        { name: 'java.nio', description: 'Defines buffers which are containers for data, and NIO packages overview' },
        { name: 'java.nio.channels', description: 'Defines channels, which represent connections to entities capable of performing I/O operations' },
        { name: 'java.nio.channels.spi', description: 'Service-provider classes for the java.nio.channels package' },
        { name: 'java.nio.charset', description: 'Defines charsets, decoders, and encoders, for translating between bytes and Unicode characters' },
        { name: 'java.nio.charset.spi', description: 'Service-provider classes for the java.nio.charset package' },
        { name: 'java.nio.file', description: 'Defines interfaces and classes for the Java virtual machine to access files, file attributes, and file systems' },
        { name: 'java.nio.file.attribute', description: 'Interfaces and classes for file attributes and metadata' },
        { name: 'java.nio.file.spi', description: 'Service-provider classes for the java.nio.file package' },
        
        // Math and Numerics
        { name: 'java.math', description: 'Classes for performing arbitrary-precision integer (BigInteger) and decimal (BigDecimal) arithmetic' },
        
        // Networking
        { name: 'java.net', description: 'Classes for implementing networking applications' },
        { name: 'java.net.http', description: 'HTTP Client and WebSocket API' },
        { name: 'java.net.spi', description: 'Service-provider interfaces for java.net package' },
        
        // SQL and Database
        { name: 'java.sql', description: 'The JDBC API for accessing relational database data sources' },
        { name: 'java.sql.rowset', description: 'Standard interfaces and base classes for JDBC RowSet implementations' },
        { name: 'javax.sql', description: 'Extended JDBC API with additional features beyond java.sql' },
        { name: 'javax.sql.rowset', description: 'Additional RowSet implementation classes' },
        
        // Security
        { name: 'java.security', description: 'Classes and interfaces for the security framework' },
        { name: 'java.security.acl', description: 'Interfaces for Access Control Lists (ACLs)' },
        { name: 'java.security.cert', description: 'Classes and interfaces for parsing and managing certificates' },
        { name: 'java.security.interfaces', description: 'Interfaces for generating RSA (Rivest, Shamir and Adleman) and DSA (Digital Signature Algorithm) keys' },
        { name: 'java.security.spec', description: 'Classes and interfaces for key specifications and algorithm parameter specifications' },
        { name: 'javax.crypto', description: 'Classes and interfaces for cryptographic operations' },
        { name: 'javax.crypto.interfaces', description: 'Interfaces for Diffie-Hellman keys' },
        { name: 'javax.crypto.spec', description: 'Classes and interfaces for key specifications and algorithm parameter specifications' },
        
        // Text Processing
        { name: 'java.text', description: 'Classes and interfaces for handling text, dates, numbers, and messages' },
        { name: 'java.text.spi', description: 'Service provider interfaces for java.text package' },
        
        // Date and Time
        { name: 'java.time', description: 'Date, time, instants, and durations API' },
        { name: 'java.time.chrono', description: 'Calendar systems other than ISO-8601' },
        { name: 'java.time.format', description: 'Classes for formatting and parsing dates and times' },
        { name: 'java.time.temporal', description: 'Access to date and time using fields and units' },
        { name: 'java.time.zone', description: 'Support for time-zones and their rules' },
        
        // GUI and Graphics
        { name: 'java.awt', description: 'Classes for creating user interfaces and for painting graphics' },
        { name: 'java.awt.color', description: 'Classes for color spaces' },
        { name: 'java.awt.datatransfer', description: 'Interfaces and classes for transferring data between applications' },
        { name: 'java.awt.dnd', description: 'Drag and Drop subsystem' },
        { name: 'java.awt.event', description: 'Interfaces and classes for dealing with AWT events' },
        { name: 'java.awt.font', description: 'Classes and interfaces relating to fonts' },
        { name: 'java.awt.geom', description: 'Classes for defining and performing operations on 2D geometric objects' },
        { name: 'java.awt.im', description: 'Classes and interfaces for input method framework' },
        { name: 'java.awt.im.spi', description: 'Service provider interfaces for input methods' },
        { name: 'java.awt.image', description: 'Classes for creating and modifying images' },
        { name: 'java.awt.image.renderable', description: 'Interfaces and classes for producing rendering-independent images' },
        { name: 'java.awt.print', description: 'Classes and interfaces for a general printing API' },
        
        // Swing UI
        { name: 'javax.swing', description: 'Lightweight UI components that work the same on all platforms' },
        { name: 'javax.swing.border', description: 'Classes and interfaces for drawing specialized borders around Swing components' },
        { name: 'javax.swing.colorchooser', description: 'Classes and interfaces for color chooser UI component' },
        { name: 'javax.swing.event', description: 'Event classes and interfaces for Swing components' },
        { name: 'javax.swing.filechooser', description: 'Classes and interfaces for file chooser UI component' },
        { name: 'javax.swing.plaf', description: 'Interfaces and classes for Swing look-and-feel support' },
        { name: 'javax.swing.plaf.basic', description: 'Basic look-and-feel implementation' },
        { name: 'javax.swing.plaf.metal', description: 'Metal look-and-feel implementation' },
        { name: 'javax.swing.plaf.nimbus', description: 'Nimbus look-and-feel implementation' },
        { name: 'javax.swing.table', description: 'Classes and interfaces for dealing with Swing table components' },
        { name: 'javax.swing.text', description: 'Classes and interfaces for dealing with editable and non-editable text components' },
        { name: 'javax.swing.text.html', description: 'Classes and interfaces for creating and viewing HTML documents' },
        { name: 'javax.swing.tree', description: 'Classes and interfaces for dealing with Swing tree components' },
        
        // Sound and Media
        { name: 'javax.sound.midi', description: 'Interfaces and classes for I/O, sequencing, and synthesis of MIDI data' },
        { name: 'javax.sound.sampled', description: 'Interfaces and classes for capture, processing, and playback of sampled audio data' },
        
        // Beans
        { name: 'java.beans', description: 'Classes related to developing beans - components based on the JavaBeans architecture' },
        { name: 'java.beans.beancontext', description: 'Classes and interfaces relating to bean context' },
        
        // Other Java APIs
        { name: 'java.rmi', description: 'Remote Method Invocation API' },
        { name: 'java.rmi.registry', description: 'RMI Registry API' },
        { name: 'java.rmi.server', description: 'RMI Server API' },
        { name: 'javax.annotation', description: 'Common annotations for the Java platform' },
        { name: 'javax.management', description: 'Java Management Extensions (JMX) API' },
        { name: 'javax.naming', description: 'Java Naming and Directory Interface (JNDI)' },
        { name: 'javax.xml', description: 'XML processing APIs' },
        { name: 'javax.xml.parsers', description: 'Provides classes allowing the processing of XML documents' },
        { name: 'javax.xml.transform', description: 'For processing XML transformations' },
        
        // Java Enterprise APIs
        { name: 'javax.servlet', description: 'Classes and interfaces for servlet API' },
        { name: 'javax.servlet.http', description: 'Classes and interfaces for HTTP servlets' },
        { name: 'javax.ejb', description: 'Enterprise JavaBeans API' },
        { name: 'javax.persistence', description: 'Java Persistence API (JPA)' },
        
        // JavaFX (Modern UI toolkit)
        { name: 'javafx.animation', description: 'JavaFX animation APIs' },
        { name: 'javafx.application', description: 'JavaFX application framework' },
        { name: 'javafx.scene', description: 'JavaFX scene graph APIs' },
        { name: 'javafx.scene.control', description: 'JavaFX UI controls' },
        { name: 'javafx.scene.layout', description: 'JavaFX layout containers' },
        { name: 'javafx.stage', description: 'JavaFX window toolkit' }
    ]
};

// Helper function to lookup a type in the hierarchy
function lookupJavaType(typeName) {
    // Handle fully qualified type names
    if (typeName.includes('.')) {
        const parts = typeName.split('.');
        if (parts.length === 3 && parts[0] === 'java') {
            // Format like java.util.ArrayList
            const packageName = parts[1];
            const className = parts[2];
            
            if (JavaTypeSystem.java[packageName] && JavaTypeSystem.java[packageName][className]) {
                return JavaTypeSystem.java[packageName][className];
            }
        }
    } else {
        // Check in java.lang package (implicitly imported)
        if (JavaTypeSystem.java.lang[typeName]) {
            return JavaTypeSystem.java.lang[typeName];
        }
        
        // Check in base types
        if (JavaTypeSystem.baseTypes[typeName]) {
            return JavaTypeSystem.baseTypes[typeName];
        }
    }
    
    return null;
}

// Helper to get all methods for a type including inherited ones
function getAllMethodsForType(typeName) {
    const methods = [];
    const typeInfo = lookupJavaType(typeName);
    
    if (!typeInfo) {
        return methods;
    }
    
    // Add direct methods
    if (typeInfo.methods) {
        methods.push(...typeInfo.methods);
    }
    
    // Add static methods if present
    if (typeInfo.staticMethods) {
        methods.push(...typeInfo.staticMethods);
    }
    
    // Add inherited methods
    if (typeInfo.inherits) {
        const parentMethods = getAllMethodsForType(typeInfo.inherits);
        methods.push(...parentMethods);
    }
    
    return methods;
}

// Get all fields for a type including inherited ones
function getAllFieldsForType(typeName) {
    const fields = [];
    const typeInfo = lookupJavaType(typeName);
    
    if (!typeInfo) {
        return fields;
    }
    
    // Add direct fields
    if (typeInfo.fields) {
        fields.push(...typeInfo.fields);
    }
    
    // Add inherited fields
    if (typeInfo.inherits) {
        const parentFields = getAllFieldsForType(typeInfo.inherits);
        fields.push(...parentFields);
    }
    
    return fields;
}

// Export for use in other modules
window.JavaTypeSystem = JavaTypeSystem;
window.lookupJavaType = lookupJavaType;
window.getAllMethodsForType = getAllMethodsForType;
window.getAllFieldsForType = getAllFieldsForType;
