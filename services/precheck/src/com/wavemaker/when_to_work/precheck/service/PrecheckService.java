package com.wavemaker.when_to_work.precheck.service;


import com.wavemaker.when_to_work.precheck.model.*;
import com.wavemaker.when_to_work.precheck.model.RootRequest;
import com.wavemaker.when_to_work.precheck.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface PrecheckService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
   * @return RootResponse
   */
  @RequestLine("POST /scheduling/validation/precheck")
  @Headers({
    "Content-Type: application/json",
    "Accept: application/json",  })
  RootResponse invoke(RootRequest body);

}
